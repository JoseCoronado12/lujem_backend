import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { Customer } from '../customer/entities/customer.entity';
import { Invoice } from '../invoice/entities/invoice.entity';
import { Product } from '../product/entities/product.entity';
import { User } from '../user/entities/user.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { CreateOnlineSaleDto } from './dto/create-online-sale.dto';
import { SaleDetail } from './entities/sale-detail.entity';
import { Sale } from './entities/sale.entity';
import { SaleChannel } from './entities/sale-channel.enum';
import { SaleStatus } from './entities/sale-status.enum';
import { DeliverSaleDto, ReturnSaleDto, VoidSaleDto } from './dto/sale-state.dto';
import { ProductLot } from '../product/entities/product-lot.entity';
import { Prescription } from './entities/prescription.entity';
import { PrescriptionDto } from './dto/prescription.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

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

  async create(
    createDto: CreateSaleDto,
    userId: number | null,
    isCustomerOrder = false,
  ): Promise<Sale> {
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
        createDto.canal === SaleChannel.PRESENCIAL && userId !== null
          ? await queryRunner.manager.findOneBy(User, { id: userId })
          : null;
      if (createDto.canal === SaleChannel.PRESENCIAL && !user) {
        throw new NotFoundException(`Usuario ${userId} no encontrado`);
      }

      const details: SaleDetail[] = [];
      let subtotalCents = 0;

      for (const detailDto of createDto.detalles) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { codigoBarras: detailDto.codigoBarras },
          lock: isCustomerOrder ? { mode: 'pessimistic_write' } : undefined,
        });
        if (!product) {
          throw new NotFoundException(
            `Producto ${detailDto.codigoBarras} no encontrado`,
          );
        }
        if (isCustomerOrder && product.requiereFormula) {
          throw new BadRequestException(
            `El producto ${product.codigoBarras} requiere una fórmula médica y no se puede comprar en línea`,
          );
        }
        if (
          !isCustomerOrder &&
          product.requiereFormula &&
          (!createDto.prescripcionNumero ||
            !createDto.prescripcionMedico ||
            !createDto.prescripcionFecha)
        ) {
          throw new BadRequestException(
            `El producto ${product.codigoBarras} requiere datos de prescripción`,
          );
        }
        if (isCustomerOrder) {
          const available = product.stock - (product.stockReservado ?? 0);
          if (available < detailDto.cantidad) {
            throw new BadRequestException(
              `Stock insuficiente disponible para ${product.codigoBarras}`,
            );
          }
          product.stockReservado = (product.stockReservado ?? 0) + detailDto.cantidad;
          await queryRunner.manager.save(product);
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
        usuario: user as User,
        canal: createDto.canal,
        subtotal: fromCents(subtotalCents),
        descuento: fromCents(discountCents),
        total: fromCents(subtotalCents - discountCents),
        estado: SaleStatus.PENDIENTE_PAGO,
        fechaReserva: isCustomerOrder
          ? new Date(Date.now() + 30 * 60 * 1000)
          : null,
        prescripcionNumero: createDto.prescripcionNumero ?? null,
        prescripcionMedico: createDto.prescripcionMedico ?? null,
        prescripcionFecha: createDto.prescripcionFecha ?? null,
        detalles: details,
      });

      const savedSale = await queryRunner.manager.save(sale);
      if (createDto.formula) {
        await queryRunner.manager.save(
          queryRunner.manager.create(Prescription, {
            venta: savedSale,
            cliente: customer,
            usuario: user as User,
            numeroFormula: createDto.formula.numeroFormula,
            nombreMedico: createDto.formula.nombreMedico,
            fechaFormula: createDto.formula.fechaFormula,
            tipoControl: createDto.formula.tipoControl,
            archivoUrl: createDto.formula.archivoUrl ?? null,
          }),
        );
      }
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

  async createForCustomer(
    createDto: CreateOnlineSaleDto,
    customerId: string,
  ): Promise<Sale> {
    return await this.create(
      {
        identificacionCliente: customerId,
        canal: SaleChannel.EN_LINEA,
        detalles: createDto.detalles,
      },
      null,
      true,
    );
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async releaseExpiredReservations(): Promise<number> {
    const sales = await this.saleRepository.find({
      where: {
        canal: SaleChannel.EN_LINEA,
        estado: In([
          SaleStatus.PENDIENTE_PAGO,
          SaleStatus.PAGO_EN_REVISION,
        ]),
      },
      relations: { detalles: { producto: true } },
    });
    let released = 0;
    const now = new Date();

    for (const sale of sales) {
      if (!sale.fechaReserva || sale.fechaReserva.getTime() >= now.getTime()) {
        continue;
      }

      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        const lockedSale = await queryRunner.manager.findOne(Sale, {
          where: { id: sale.id },
          relations: { detalles: { producto: true } },
          lock: { mode: 'pessimistic_write' },
        });
        if (
          !lockedSale?.fechaReserva ||
          lockedSale.fechaReserva.getTime() >= now.getTime() ||
          ![
            SaleStatus.PENDIENTE_PAGO,
            SaleStatus.PAGO_EN_REVISION,
          ].includes(lockedSale.estado)
        ) {
          await queryRunner.commitTransaction();
          continue;
        }

        for (const detail of lockedSale.detalles) {
          const product = await queryRunner.manager.findOne(Product, {
            where: { codigoBarras: detail.producto.codigoBarras },
            lock: { mode: 'pessimistic_write' },
          });
          if (product) {
            product.stockReservado = Math.max(
              0,
              (product.stockReservado ?? 0) - detail.cantidad,
            );
            await queryRunner.manager.save(product);
          }
        }
        lockedSale.estado = SaleStatus.ANULADA;
        lockedSale.motivoAnulacion = 'Reserva de stock expirada';
        lockedSale.fechaReserva = null;
        await queryRunner.manager.save(lockedSale);
        await queryRunner.commitTransaction();
        released++;
      } catch (error) {
        if (queryRunner.isTransactionActive) {
          await queryRunner.rollbackTransaction();
        }
        throw error;
      } finally {
        await queryRunner.release();
      }
    }
    return released;
  }

  async findAll(page = 1, limit = 20, search?: string): Promise<{ items: Sale[]; total: number; page: number; limit: number; pages: number }> {
    const qb = this.saleRepository
      .createQueryBuilder('venta')
      .leftJoinAndSelect('venta.cliente', 'cliente')
      .leftJoinAndSelect('venta.usuario', 'usuario')
      .leftJoinAndSelect('venta.detalles', 'detalle')
      .leftJoinAndSelect('detalle.producto', 'producto');
    if (search) {
      qb.andWhere(
        '(CAST(venta.id AS CHAR) LIKE :search OR cliente.identificacion LIKE :search OR cliente.nombres LIKE :search OR cliente.apellidos LIKE :search)',
        { search: `%${search}%` },
      );
    }
    const [items, total] = await qb
      .orderBy('venta.fechaHora', 'DESC')
      .addOrderBy('venta.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
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

  async findAllForCustomer(
    customerId: string,
    page = 1,
    limit = 20,
  ): Promise<{ items: Sale[]; total: number; page: number; limit: number; pages: number }> {
    const [items, total] = await this.saleRepository.findAndCount({
      where: { cliente: { identificacion: customerId } },
      relations: {
        cliente: true,
        detalles: { producto: true },
      },
      order: { fechaHora: 'DESC', id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOneForCustomer(id: number, customerId: string): Promise<Sale> {
    const sale = await this.saleRepository.findOne({
      where: { id, cliente: { identificacion: customerId } },
      relations: {
        cliente: true,
        detalles: { producto: true },
      },
    });
    if (!sale) {
      throw new NotFoundException(`Venta ${id} no encontrada`);
    }
    return sale;
  }

  async findInvoiceForCustomer(id: number, customerId: string): Promise<Invoice> {
    const sale = await this.findOneForCustomer(id, customerId);
    const invoice = await this.saleRepository.manager.findOne(Invoice, {
      where: { venta: { id: sale.id } },
      relations: {
        venta: {
          cliente: true,
          detalles: { producto: true },
        },
      },
    });
    if (!invoice) {
      throw new NotFoundException(
        `No hay una factura emitida para la venta ${id}`,
      );
    }
    return invoice;
  }

  async deliver(id: number, _dto: DeliverSaleDto): Promise<Sale> {
    const sale = await this.findOne(id);
    if (sale.estado !== SaleStatus.PAGADA) {
      throw new BadRequestException(
        `Solo se puede entregar una venta PAGADA`,
      );
    }
    sale.estado = SaleStatus.ENTREGADA;
    sale.fechaEntrega = new Date();
    await this.saleRepository.save(sale);
    return await this.findOne(id);
  }

  async voidSale(id: number, dto: VoidSaleDto): Promise<Sale> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const sale = await queryRunner.manager.findOne(Sale, {
        where: { id },
        relations: { detalles: { producto: true } },
        lock: { mode: 'pessimistic_write' },
      });
      if (!sale) throw new NotFoundException(`Venta ${id} no encontrada`);
      if (sale.estado === SaleStatus.ANULADA) {
        throw new BadRequestException('La venta ya está anulada');
      }
      if (
        sale.estado !== SaleStatus.PENDIENTE_PAGO &&
        sale.estado !== SaleStatus.PAGO_EN_REVISION &&
        sale.estado !== SaleStatus.PAGADA &&
        sale.estado !== SaleStatus.ENTREGADA
      ) {
        throw new BadRequestException(
          `No se puede anular una venta ${sale.estado}`,
        );
      }

      if (
        sale.estado === SaleStatus.PAGADA ||
        sale.estado === SaleStatus.ENTREGADA
      ) {
        for (const detail of sale.detalles) {
          const product = await queryRunner.manager.findOne(Product, {
            where: { codigoBarras: detail.producto.codigoBarras },
            lock: { mode: 'pessimistic_write' },
          });
          if (!product) {
            throw new NotFoundException(
              `Producto ${detail.producto.codigoBarras} no encontrado`,
            );
          }
          product.stock += detail.cantidad;
          await queryRunner.manager.save(product);
        }
      } else if (sale.canal === SaleChannel.EN_LINEA) {
        for (const detail of sale.detalles) {
          const product = await queryRunner.manager.findOne(Product, {
            where: { codigoBarras: detail.producto.codigoBarras },
            lock: { mode: 'pessimistic_write' },
          });
          if (product) {
            product.stockReservado = Math.max(
              0,
              (product.stockReservado ?? 0) - detail.cantidad,
            );
            await queryRunner.manager.save(product);
          }
        }
      }

      sale.estado = SaleStatus.ANULADA;
      sale.motivoAnulacion = dto.motivo;
      await queryRunner.manager.save(sale);
      await queryRunner.commitTransaction();
      return await this.findOne(id);
    } catch (error) {
      if (queryRunner.isTransactionActive) await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async returnSale(id: number, dto: ReturnSaleDto): Promise<Sale> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const sale = await queryRunner.manager.findOne(Sale, {
        where: { id },
        relations: { detalles: { producto: true } },
        lock: { mode: 'pessimistic_write' },
      });
      if (!sale) throw new NotFoundException(`Venta ${id} no encontrada`);
      if (
        sale.estado !== SaleStatus.PAGADA &&
        sale.estado !== SaleStatus.ENTREGADA
      ) {
        throw new BadRequestException(
          'Solo se puede devolver una venta PAGADA o ENTREGADA',
        );
      }

      for (const detail of sale.detalles) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { codigoBarras: detail.producto.codigoBarras },
          lock: { mode: 'pessimistic_write' },
        });
        if (!product) {
          throw new NotFoundException(
            `Producto ${detail.producto.codigoBarras} no encontrado`,
          );
        }
        product.stock += detail.cantidad;
        await queryRunner.manager.save(product);
      }

      sale.estado = SaleStatus.ANULADA;
      sale.fechaDevolucion = new Date();
      sale.motivoDevolucion = dto.motivo;
      await queryRunner.manager.save(sale);
      await queryRunner.commitTransaction();
      return await this.findOne(id);
    } catch (error) {
      if (queryRunner.isTransactionActive) await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async registerPrescription(
    saleId: number,
    dto: PrescriptionDto,
    userId: number,
  ): Promise<Prescription> {
    const sale = await this.saleRepository.findOne({
      where: { id: saleId },
      relations: { cliente: true },
    });
    if (!sale) throw new NotFoundException(`Venta ${saleId} no encontrada`);
    const user = await this.saleRepository.manager.findOneBy(User, { id: userId });
    if (!user) throw new NotFoundException(`Usuario ${userId} no encontrado`);
    return await this.saleRepository.manager.save(
      this.saleRepository.manager.create(Prescription, {
        venta: sale,
        cliente: sale.cliente,
        usuario: user,
        numeroFormula: dto.numeroFormula,
        nombreMedico: dto.nombreMedico,
        fechaFormula: dto.fechaFormula,
        tipoControl: dto.tipoControl,
        archivoUrl: dto.archivoUrl ?? null,
      }),
    );
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
    if (
      sale.canal === SaleChannel.EN_LINEA &&
      sale.fechaReserva &&
      sale.fechaReserva.getTime() < Date.now()
    ) {
      throw new BadRequestException(
        'La reserva de stock de la venta en línea expiró',
      );
    }
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
      if (sale.canal === SaleChannel.EN_LINEA) {
        product.stockReservado = Math.max(
          0,
          (product.stockReservado ?? 0) - detail.cantidad,
        );
      }
      await manager.save(product);

      let remaining = detail.cantidad;
      const lots = await manager.find(ProductLot, {
        where: {
          producto: { codigoBarras: product.codigoBarras },
          activo: true,
        },
        order: { fechaVencimiento: 'ASC', id: 'ASC' },
      });
      for (const lot of lots) {
        if (remaining === 0) break;
        if (lot.fechaVencimiento <= new Date().toISOString().slice(0, 10)) {
          throw new BadRequestException(
            `El producto ${product.codigoBarras} tiene lotes vencidos disponibles`,
          );
        }
        const toConsume = Math.min(remaining, lot.cantidad);
        lot.cantidad -= toConsume;
        remaining -= toConsume;
        lot.activo = lot.cantidad > 0;
        await manager.save(lot);
      }
      if (remaining > 0) {
        throw new BadRequestException(
          `No hay lotes suficientes para ${product.codigoBarras}`,
        );
      }
    }

    sale.estado = SaleStatus.PAGADA;
    await manager.save(sale);

    const existingInvoice = await manager.findOne(Invoice, {
      where: { venta: { id: sale.id } },
    });
    if (!existingInvoice) {
      let taxesCents = 0;
      for (const detail of details) {
        const taxableBaseCents = Number.isFinite(detail.subtotal)
          ? toCents(detail.subtotal)
          : 0;
        const rate = Number(detail.producto.tasaImpuesto ?? 0);
        taxesCents += Math.round((taxableBaseCents * rate) / 100);
      }
      await manager.save(
        manager.create(Invoice, {
          numeroFactura: `FAC-${sale.id.toString().padStart(8, '0')}`,
          venta: sale,
          subtotal: sale.subtotal,
          descuento: sale.descuento,
          impuestos: fromCents(taxesCents),
          total: fromCents(toCents(sale.total) + taxesCents),
        }),
      );
    }
  }
}
