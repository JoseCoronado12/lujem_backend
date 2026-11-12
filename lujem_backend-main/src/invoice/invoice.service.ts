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

  async findAll(): Promise<Invoice[]> {
    return await this.invoiceRepository.find({
      relations: {
        venta: {
          cliente: true,
          detalles: { producto: true },
        },
      },
      order: { fechaEmision: 'DESC', id: 'DESC' },
    });
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
