import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Sale } from '../../sale/entities/sale.entity';

const decimalTransformer = {
  to: (value: number): number => value,
  from: (value: string): number => Number(value),
};

@Entity('factura_venta')
@Index('IDX_factura_venta_numero', ['numeroFactura'], { unique: true })
@Index('IDX_factura_venta_venta', ['venta'], { unique: true })
export class Invoice {
  @PrimaryGeneratedColumn({ name: 'id_factura', type: 'int' })
  id: number;

  @Column({ name: 'numero_factura', type: 'varchar', length: 30 })
  numeroFactura: string;

  @OneToOne(() => Sale, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'id_venta',
    foreignKeyConstraintName: 'FK_factura_venta_venta',
  })
  venta: Sale;

  @Column({
    name: 'fecha_emision',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaEmision: Date;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  subtotal: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  descuento: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  impuestos: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  total: number;
}
