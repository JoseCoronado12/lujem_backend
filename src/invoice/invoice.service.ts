import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from './entities/invoice.entity';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
  ) {}

  async findAll(page = 1, limit = 20, search?: string): Promise<{ items: Invoice[]; total: number; page: number; limit: number; pages: number }> {
    const qb = this.invoiceRepository
      .createQueryBuilder('factura')
      .leftJoinAndSelect('factura.venta', 'venta')
      .leftJoinAndSelect('venta.cliente', 'cliente')
      .leftJoinAndSelect('venta.detalles', 'detalle')
      .leftJoinAndSelect('detalle.producto', 'producto');
    if (search) {
      qb.andWhere(
        '(factura.numeroFactura LIKE :search OR CAST(venta.id AS CHAR) LIKE :search)',
        { search: `%${search}%` },
      );
    }
    const [items, total] = await qb
      .orderBy('factura.fechaEmision', 'DESC')
      .addOrderBy('factura.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOne(id: number): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: {
        venta: {
          cliente: true,
          detalles: { producto: true },
        },
      },
    });
    if (!invoice) {
      throw new NotFoundException(`Factura ${id} no encontrada`);
    }
    return invoice;
  }

  async findBySale(saleId: number): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { venta: { id: saleId } },
      relations: {
        venta: {
          cliente: true,
          detalles: { producto: true },
        },
      },
    });
    if (!invoice) {
      throw new NotFoundException(
        `No hay una factura emitida para la venta ${saleId}`,
      );
    }
    return invoice;
  }
}
