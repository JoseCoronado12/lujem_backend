import { describe, expect, it, jest } from '@jest/globals';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Invoice } from '../invoice/entities/invoice.entity';
import { Product } from '../product/entities/product.entity';
import { SaleDetail } from './entities/sale-detail.entity';
import { Sale } from './entities/sale.entity';
import { SaleStatus } from './entities/sale-status.enum';
import { SaleService } from './sale.service';

describe('SaleService payment completion', () => {
  const createService = (): SaleService =>
    new SaleService(
      {} as Repository<Sale>,
      {} as DataSource,
    );

  it('deducts inventory and creates an invoice when the sale is paid', async () => {
    const product = { codigoBarras: '123', stock: 5 } as Product;
    const detail = {
      producto: product,
      cantidad: 2,
    } as SaleDetail;
    const manager = {
      find: jest.fn().mockResolvedValue([detail]),
      findOne: jest
        .fn()
        .mockResolvedValueOnce(product)
        .mockResolvedValueOnce(null),
      save: jest.fn(async <T>(entity: T) => entity),
      create: jest.fn((_entity: unknown, values: object) => values),
    } as unknown as EntityManager;
    const sale = {
      id: 42,
      subtotal: 100,
      descuento: 10,
      total: 90,
      estado: SaleStatus.PENDIENTE_PAGO,
    } as Sale;

    await createService().markPaidInTransaction(manager, sale);

    expect(product.stock).toBe(3);
    expect(sale.estado).toBe(SaleStatus.PAGADA);
    expect(manager.create).toHaveBeenCalledWith(
      Invoice,
      expect.objectContaining({
        numeroFactura: 'FAC-00000042',
        venta: sale,
        subtotal: 100,
        descuento: 10,
        impuestos: 0,
        total: 90,
      }),
    );
  });

  it('does not create another invoice for an already invoiced sale', async () => {
    const manager = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue({ id: 1 } as Invoice),
      save: jest.fn(async <T>(entity: T) => entity),
      create: jest.fn((_entity: unknown, values: object) => values),
    } as unknown as EntityManager;
    const sale = {
      id: 42,
      subtotal: 100,
      descuento: 0,
      total: 100,
      estado: SaleStatus.PENDIENTE_PAGO,
    } as Sale;

    await createService().markPaidInTransaction(manager, sale);

    expect(manager.create).not.toHaveBeenCalled();
    expect(manager.save).toHaveBeenCalledTimes(1);
  });
});
