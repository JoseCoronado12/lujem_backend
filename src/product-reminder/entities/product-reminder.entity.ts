import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Customer } from '../../customer/entities/customer.entity';
import { Product } from '../../product/entities/product.entity';

@Entity('recordatorio_producto')
@Index('IDX_recordatorio_producto_cliente', ['cliente'])
@Index('IDX_recordatorio_producto_codigo', ['producto'])
@Index('IDX_recordatorio_producto_fecha_activo', ['fechaRecordatorio', 'activo'])
export class ProductReminder {
  @PrimaryGeneratedColumn({ name: 'id_recordatorio', type: 'int' })
  id: number;

  @ManyToOne(() => Customer, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'identificacion_cliente',
    foreignKeyConstraintName: 'FK_recordatorio_producto_cliente',
  })
  cliente: Customer;

  @ManyToOne(() => Product, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'codigo_barras',
    foreignKeyConstraintName: 'FK_recordatorio_producto_codigo',
  })
  producto: Product;

  @Column({ name: 'fecha_recordatorio', type: 'date' })
  fechaRecordatorio: string;

  @Column({ name: 'frecuencia_dias', type: 'smallint' })
  frecuenciaDias: number;

  @Column({ type: 'varchar', length: 255 })
  mensaje: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;
}
