import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Supplier } from '../../supplier/entities/supplier.entity';
import { User } from '../../user/entities/user.entity';
import { PurchaseOrderStatus } from '../purchase-order-status.enum';
import { PurchaseOrderDetail } from './purchase-order-detail.entity';

const decimalTransformer = {
  to: (value: number): number => value,
  from: (value: string): number => Number(value),
};

@Entity('ordenes_compra')
@Index('IDX_ordenes_compra_proveedor', ['proveedor'])
@Index('IDX_ordenes_compra_usuario', ['usuario'])
export class PurchaseOrder {
  @PrimaryGeneratedColumn({ name: 'id_orden_compra', type: 'int' })
  id: number;

  @ManyToOne(() => Supplier, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'codigo_proveedor',
    foreignKeyConstraintName: 'FK_ordenes_compra_proveedor',
  })
  proveedor: Supplier;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'id_usuario',
    foreignKeyConstraintName: 'FK_ordenes_compra_usuario',
  })
  usuario: User;

  @Column({
    name: 'fecha',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fecha: Date;

  @Column({
    type: 'enum',
    enum: PurchaseOrderStatus,
    default: PurchaseOrderStatus.BORRADOR,
  })
  estado: PurchaseOrderStatus;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  total: number;

  @Column({ type: 'varchar', length: 255, nullable: true, default: null })
  observaciones: string | null;

  @OneToMany(() => PurchaseOrderDetail, (detail) => detail.orden, {
    cascade: ['insert'],
  })
  detalles: PurchaseOrderDetail[];
}
