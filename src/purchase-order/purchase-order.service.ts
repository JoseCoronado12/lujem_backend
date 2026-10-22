import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Product } from '../product/entities/product.entity';
import { Supplier } from '../supplier/entities/supplier.entity';
import { User } from '../user/entities/user.entity';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { PurchaseOrderDetailDto } from './dto/purchase-order-detail.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { PurchaseOrderDetail } from './entities/purchase-order-detail.entity';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderStatus } from './purchase-order-status.enum';

const MAX_DECIMAL_CENTS = 9_999_999_999;
const MAX_INT = 2_147_483_647;

function toCents(amount: number): number {
  return Math.round(amount * 100);
}

function fromCents(amount: number): number {
  return Number((amount / 100).toFixed(2));
}

@Injectable()
export class PurchaseOrderService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly purchaseOrderRepository: Repository<PurchaseOrder>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createDto: CreatePurchaseOrderDto,
    userId: number,
  ): Promise<PurchaseOrder> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const supplier = await queryRunner.manager.findOneBy(Supplier, {
        codigoProveedor: createDto.codigoProveedor,
      });
      if (!supplier) {
        throw new NotFoundException(
          `Proveedor ${createDto.codigoProveedor} no encontrado`,
        );
      }

      const user = await queryRunner.manager.findOneBy(User, { id: userId });
      if (!user) {
        throw new NotFoundException(`Usuario ${userId} no encontrado`);
      }

      const { details, total } = await this.buildDetails(
        queryRunner.manager,
        createDto.detalles,
      );
      const order = queryRunner.manager.create(PurchaseOrder, {
        proveedor: supplier,
        usuario: user,
        observaciones: createDto.observaciones ?? null,
        estado: PurchaseOrderStatus.BORRADOR,
        total,
        detalles: details,
      });

      const savedOrder = await queryRunner.manager.save(order);
      await queryRunner.commitTransaction();
      return await this.findOne(savedOrder.id);
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<PurchaseOrder[]> {
    return await this.purchaseOrderRepository.find({
      relations: {
        proveedor: true,
        usuario: true,
        detalles: { producto: true },
      },
      order: { fecha: 'DESC', id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<PurchaseOrder> {
    const order = await this.purchaseOrderRepository.findOne({
      where: { id },
      relations: {
        proveedor: true,
        usuario: true,
        detalles: { producto: true },
      },
    });
    if (!order) {
      throw new NotFoundException(`Orden de compra ${id} no encontrada`);
    }

    return order;
  }

  async update(
    id: number,
    updateDto: UpdatePurchaseOrderDto,
  ): Promise<PurchaseOrder> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await queryRunner.manager.findOne(PurchaseOrder, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!order) {
        throw new NotFoundException(`Orden de compra ${id} no encontrada`);
      }

      const { estado: requestedStatus, ...changes } = updateDto;
      if (
        (changes.detalles ||
          changes.observaciones !== undefined ||
          changes.codigoProveedor) &&
        order.estado !== PurchaseOrderStatus.BORRADOR
      ) {
        throw new BadRequestException(
          'Solo se puede editar una orden mientras está en BORRADOR',
        );
      }

      if (changes.codigoProveedor) {
        const supplier = await queryRunner.manager.findOneBy(Supplier, {
          codigoProveedor: changes.codigoProveedor,
        });
        if (!supplier) {
          throw new NotFoundException(
            `Proveedor ${changes.codigoProveedor} no encontrado`,
          );
        }
        order.proveedor = supplier;
      }

      if (changes.detalles) {
        const { details, total } = await this.buildDetails(
          queryRunner.manager,
          changes.detalles,
        );
        await queryRunner.manager
          .createQueryBuilder()
          .delete()
          .from(PurchaseOrderDetail)
          .where('id_orden_compra = :orderId', { orderId: order.id })
          .execute();
        order.detalles = details;
        order.total = total;
      }

      if (changes.observaciones !== undefined) {
        order.observaciones = changes.observaciones;
      }

      if (requestedStatus && requestedStatus !== order.estado) {
        this.assertTransition(order.estado, requestedStatus);
        if (requestedStatus === PurchaseOrderStatus.RECIBIDA) {
          if (order.estado !== PurchaseOrderStatus.ENVIADA) {
            throw new BadRequestException(
              'Solo se puede recibir una orden que esté ENVIADA',
            );
          }
          await this.receiveOrder(queryRunner.manager, order.id);
        }
        order.estado = requestedStatus;
      }

      await queryRunner.manager.save(order);
      await queryRunner.commitTransaction();
      return await this.findOne(order.id);
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async buildDetails(
    manager: EntityManager,
    detailDtos: PurchaseOrderDetailDto[],
  ): Promise<{ details: PurchaseOrderDetail[]; total: number }> {
    const details: PurchaseOrderDetail[] = [];
    let totalCents = 0;

    for (const detailDto of detailDtos) {
      const product = await manager.findOneBy(Product, {
        codigoBarras: detailDto.codigoBarras,
      });
      if (!product) {
        throw new NotFoundException(
          `Producto ${detailDto.codigoBarras} no encontrado`,
        );
      }

      const subtotalCents =
        toCents(detailDto.costoUnitario) * detailDto.cantidad;
      totalCents += subtotalCents;
      if (subtotalCents > MAX_DECIMAL_CENTS || totalCents > MAX_DECIMAL_CENTS) {
        throw new BadRequestException(
          'El subtotal o total supera el máximo permitido',
        );
      }

      details.push(
        manager.create(PurchaseOrderDetail, {
          producto: product,
          cantidad: detailDto.cantidad,
          costoUnitario: detailDto.costoUnitario,
          subtotal: fromCents(subtotalCents),
        }),
      );
    }

    return { details, total: fromCents(totalCents) };
  }

  private assertTransition(
    current: PurchaseOrderStatus,
    next: PurchaseOrderStatus,
  ): void {
    const transitions: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
      [PurchaseOrderStatus.BORRADOR]: [
        PurchaseOrderStatus.ENVIADA,
        PurchaseOrderStatus.CANCELADA,
      ],
      [PurchaseOrderStatus.ENVIADA]: [
        PurchaseOrderStatus.RECIBIDA,
        PurchaseOrderStatus.CANCELADA,
      ],
      [PurchaseOrderStatus.RECIBIDA]: [],
      [PurchaseOrderStatus.CANCELADA]: [],
    };

    if (!transitions[current].includes(next)) {
      throw new BadRequestException(
        `No se permite cambiar de ${current} a ${next}`,
      );
    }
  }

  private async receiveOrder(
    manager: EntityManager,
    orderId: number,
  ): Promise<void> {
    const details = await manager.find(PurchaseOrderDetail, {
      where: { orden: { id: orderId } },
      relations: { producto: true },
      order: { producto: { codigoBarras: 'ASC' } },
    });

    for (const detail of details) {
      const product = await manager.findOne(Product, {
        where: { codigoBarras: detail.producto.codigoBarras },
        lock: { mode: 'pessimistic_write' },
      });
      if (!product) {
        throw new NotFoundException(
          `Producto ${detail.producto.codigoBarras} no encontrado`,
        );
      }
      if (product.stock + detail.cantidad > MAX_INT) {
        throw new BadRequestException(
          `El stock de ${product.codigoBarras} supera el máximo permitido`,
        );
      }

      product.stock += detail.cantidad;
      await manager.save(product);
    }
  }
}
