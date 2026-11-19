import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from './entities/invoice.entity';

@Injectable()
export class ElectronicInvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    private readonly configService: ConfigService,
  ) {}

  async submit(invoiceId: number): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
      relations: { venta: { cliente: true, detalles: { producto: true } } },
    });
    if (!invoice) throw new Error(`Factura ${invoiceId} no encontrada`);

    const endpoint = this.configService.get<string>('ELECTRONIC_INVOICE_ENDPOINT');
    const apiKey = this.configService.get<string>('ELECTRONIC_INVOICE_API_KEY');
    if (!endpoint || !apiKey) {
      throw new ServiceUnavailableException(
        'Configure ELECTRONIC_INVOICE_ENDPOINT y ELECTRONIC_INVOICE_API_KEY',
      );
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        number: invoice.numeroFactura,
        saleId: invoice.venta.id,
        customer: invoice.venta.cliente,
        subtotal: invoice.subtotal,
        discount: invoice.descuento,
        taxes: invoice.impuestos,
        total: invoice.total,
        details: invoice.venta.detalles,
      }),
    });
    const payload = await response.json().catch(() => ({})) as {
      cufe?: string;
      xmlUrl?: string;
      status?: 'ACEPTADA' | 'RECHAZADA' | 'ENVIADA';
    };
    if (!response.ok) {
      invoice.estadoElectronico = 'RECHAZADA';
      invoice.respuestaProveedor = JSON.stringify(payload);
      return await this.invoiceRepository.save(invoice);
    }

    invoice.cufe = payload.cufe ?? null;
    invoice.xmlUrl = payload.xmlUrl ?? null;
    invoice.estadoElectronico = payload.status ?? 'ENVIADA';
    invoice.respuestaProveedor = JSON.stringify(payload);
    invoice.fechaElectronica = new Date();
    return await this.invoiceRepository.save(invoice);
  }
}
