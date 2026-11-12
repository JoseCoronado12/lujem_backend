import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from '../../product/entities/product.entity';
import { PurchaseOrder } from './purchase-order.entity';

const decimalTransformer = {
  to: (value: number): number => value,
  from: (value: string): number => Number(value),
};

@Entity('detalles_orden_compra')
@Index('IDX_detalles_orden_compra_orden', ['orden'])
@Index('IDX_detalles_orden_compra_producto', ['producto'])
export class PurchaseOrderDetail {
  @PrimaryGeneratedColumn({ name: 'id_detalle_orden', type: 'int' })
  id: number;

  @ManyToOne(() => PurchaseOrder, (order) => order.detalles, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'id_orden_compra',
    foreignKeyConstraintName: 'FK_detalles_orden_compra_orden',
  })
  orden: PurchaseOrder;

  @ManyToOne(() => Product, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'codigo_barras',
    foreignKeyConstraintName: 'FK_detalles_orden_compra_producto',
  })
  producto: Product;

  @Column({ type: 'int' })
  cantidad: number;

  @Column({
    name: 'costo_unitario',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  costoUnitario: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  subtotal: number;
}
