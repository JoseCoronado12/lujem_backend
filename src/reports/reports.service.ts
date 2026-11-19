import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from '../sale/entities/sale.entity';
import { PurchaseOrder } from '../purchase-order/entities/purchase-order.entity';
import { Product } from '../product/entities/product.entity';
import { ReportQueryDto } from './dto/report-query.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Sale) private readonly saleRepository: Repository<Sale>,
    @InjectRepository(PurchaseOrder)
    private readonly purchaseRepository: Repository<PurchaseOrder>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async sales(query: ReportQueryDto) {
    const qb = this.saleRepository
      .createQueryBuilder('venta')
      .leftJoinAndSelect('venta.cliente', 'cliente')
      .leftJoinAndSelect('venta.detalles', 'detalle')
      .leftJoinAndSelect('detalle.producto', 'producto');
    if (query.from) qb.andWhere('venta.fechaHora >= :from', { from: `${query.from} 00:00:00` });
    if (query.to) qb.andWhere('venta.fechaHora <= :to', { to: `${query.to} 23:59:59` });
    const sales = await qb.orderBy('venta.fechaHora', 'DESC').getMany();
    const total = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    return { count: sales.length, total, sales };
  }

  async purchases(query: ReportQueryDto) {
    const qb = this.purchaseRepository
      .createQueryBuilder('orden')
      .leftJoinAndSelect('orden.proveedor', 'proveedor')
      .leftJoinAndSelect('orden.detalles', 'detalle')
      .leftJoinAndSelect('detalle.producto', 'producto');
    if (query.from) qb.andWhere('orden.fecha >= :from', { from: `${query.from} 00:00:00` });
    if (query.to) qb.andWhere('orden.fecha <= :to', { to: `${query.to} 23:59:59` });
    if (query.supplier) qb.andWhere('proveedor.nombre LIKE :supplier', { supplier: `%${query.supplier}%` });
    const purchases = await qb.orderBy('orden.fecha', 'DESC').getMany();
    return {
      count: purchases.length,
      total: purchases.reduce((sum, order) => sum + Number(order.total), 0),
      purchases,
    };
  }

  async topProducts() {
    return await this.saleRepository
      .createQueryBuilder('venta')
      .innerJoin('venta.detalles', 'detalle')
      .innerJoin('detalle.producto', 'producto')
      .select('producto.codigoBarras', 'codigoBarras')
      .addSelect('producto.nombreProducto', 'nombreProducto')
      .addSelect('SUM(detalle.cantidad)', 'cantidadVendida')
      .groupBy('producto.codigoBarras')
      .addGroupBy('producto.nombreProducto')
      .orderBy('cantidadVendida', 'DESC')
      .limit(20)
      .getRawMany();
  }

  async dashboard(query: ReportQueryDto) {
    const [sales, purchases, topProducts, stock] = await Promise.all([
      this.sales(query),
      this.purchases(query),
      this.topProducts(),
      this.productRepository
        .createQueryBuilder('producto')
        .select([
          'COUNT(*) AS totalProducts',
          'SUM(producto.stock) AS totalUnits',
          'SUM(producto.stock <= producto.stockMinimo) AS lowStock',
        ])
        .getRawOne(),
    ]);
    return { sales, purchases, topProducts, stock };
  }
}
