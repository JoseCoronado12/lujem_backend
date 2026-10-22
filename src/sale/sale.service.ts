import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Customer } from '../customer/entities/customer.entity';
import { Product } from '../product/entities/product.entity';
import { User } from '../user/entities/user.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SaleDetail } from './entities/sale-detail.entity';
import { Sale } from './entities/sale.entity';
import { SaleChannel } from './entities/sale-channel.enum';
import { SaleStatus } from './entities/sale-status.enum';

const MAX_DECIMAL_CENTS = 9_999_999_999;
const MAX_INT = 2_147_483_647;

function toCents(amount: number): number {
  return Math.round(amount * 100);
}

function fromCents(amount: number): number {
  return Number((amount / 100).toFixed(2));
}

@Injectable()
export class SaleService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createDto: CreateSaleDto, userId: number): Promise<Sale> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const customer = await queryRunner.manager.findOneBy(Customer, {
        identificacion: createDto.identificacionCliente,
      });
      if (!customer) {
        throw new NotFoundException(
          `Cliente ${createDto.identificacionCliente} no encontrado`,
        );
      }

      const user =
        createDto.canal === SaleChannel.PRESENCIAL
          ? await queryRunner.manager.findOneBy(User, { id: userId })
          : null;
      if (createDto.canal === SaleChannel.PRESENCIAL && !user) {
        throw new NotFoundException(`Usuario ${userId} no encontrado`);
      }

      const details: SaleDetail[] = [];
      let subtotalCents = 0;

      for (const detailDto of createDto.detalles) {
        const product = await queryRunner.manager.findOneBy(Product, {
          codigoBarras: detailDto.codigoBarras,
        });
        if (!product) {
          throw new NotFoundException(
            `Producto ${detailDto.codigoBarras} no encontrado`,
          );
        }

        const lineCents = toCents(product.valorUnitario) * detailDto.cantidad;
        subtotalCents += lineCents;
        if (
          lineCents > MAX_DECIMAL_CENTS ||
          subtotalCents > MAX_DECIMAL_CENTS
        ) {
          throw new BadRequestException(
            'El subtotal supera el máximo permitido',
          );
        }

        details.push(
          queryRunner.manager.create(SaleDetail, {
            producto: product,
            cantidad: detailDto.cantidad,
            valorUnitario: product.valorUnitario,
            subtotal: fromCents(lineCents),
          }),
        );
      }

      const discountCents = toCents(createDto.descuento ?? 0);
      if (discountCents > subtotalCents) {
        throw new BadRequestException(
          'El descuento no puede superar el subtotal',
        );
      }

      const sale = queryRunner.manager.create(Sale, {
        cliente: customer,
        usuario: user,
        canal: createDto.canal,
        subtotal: fromCents(subtotalCents),
        descuento: fromCents(discountCents),
        total: fromCents(subtotalCents - discountCents),
        estado: SaleStatus.PENDIENTE_PAGO,
        detalles: details,
      });

      const savedSale = await queryRunner.manager.save(sale);
      await queryRunner.commitTransaction();
      return await this.findOne(savedSale.id);
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<Sale[]> {
    return await this.saleRepository.find({
      relations: {
        cliente: true,
        usuario: true,
        detalles: { producto: true },
      },
      order: { fechaHora: 'DESC', id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Sale> {
    const sale = await this.saleRepository.findOne({
      where: { id },
      relations: {
        cliente: true,
        usuario: true,
        detalles: { producto: true },
      },
    });
    if (!sale) {
      throw new NotFoundException(`Venta ${id} no encontrada`);
    }
    return sale;
  }

  async markPaid(id: number): Promise<Sale> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const sale = await queryRunner.manager.findOne(Sale, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!sale) {
        throw new NotFoundException(`Venta ${id} no encontrada`);
      }
      if (
        sale.estado !== SaleStatus.PENDIENTE_PAGO &&
        sale.estado !== SaleStatus.PAGO_EN_REVISION
      ) {
        throw new BadRequestException(
          `No se puede aprobar el pago de una venta ${sale.estado}`,
        );
      }

      await this.markPaidInTransaction(queryRunner.manager, sale);
      await queryRunner.commitTransaction();
      return await this.findOne(id);
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async markPaidInTransaction(
    manager: EntityManager,
    sale: Sale,
  ): Promise<void> {
    const details = await manager.find(SaleDetail, {
      where: { venta: { id: sale.id } },
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
      if (product.stock < detail.cantidad) {
        throw new BadRequestException(
          `Stock insuficiente para ${product.codigoBarras}`,
        );
      }
      if (product.stock > MAX_INT) {
        throw new BadRequestException(
          `El stock de ${product.codigoBarras} excede el máximo permitido`,
        );
      }

      product.stock -= detail.cantidad;
      await manager.save(product);
    }

    sale.estado = SaleStatus.PAGADA;
    await manager.save(sale);
  }
}
