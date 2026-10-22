import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from '../../product/entities/product.entity';
import { Sale } from './sale.entity';

const decimalTransformer = {
  to: (value: number): number => value,
  from: (value: string): number => Number(value),
};

@Entity('detalles_venta')
@Index('IDX_detalles_venta_venta', ['venta'])
@Index('IDX_detalles_venta_producto', ['producto'])
export class SaleDetail {
  @PrimaryGeneratedColumn({ name: 'id_detalle', type: 'int' })
  id: number;

  @ManyToOne(() => Sale, (sale) => sale.detalles, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'id_venta',
    foreignKeyConstraintName: 'FK_detalles_venta_venta',
  })
  venta: Sale;

  @ManyToOne(() => Product, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'codigo_barras',
    foreignKeyConstraintName: 'FK_detalles_venta_producto',
  })
  producto: Product;

  @Column({ type: 'int' })
  cantidad: number;

  @Column({
    name: 'valor_unitario',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  valorUnitario: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  subtotal: number;
}
