import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Customer } from '../../customer/entities/customer.entity';
import { User } from '../../user/entities/user.entity';
import { SaleChannel } from './sale-channel.enum';
import { SaleStatus } from './sale-status.enum';
import { SaleDetail } from './sale-detail.entity';

const decimalTransformer = {
  to: (value: number): number => value,
  from: (value: string): number => Number(value),
};

@Entity('ventas')
@Index('IDX_ventas_cliente', ['cliente'])
@Index('IDX_ventas_usuario', ['usuario'])
export class Sale {
  @PrimaryGeneratedColumn({ name: 'id_venta', type: 'int' })
  id: number;

  @ManyToOne(() => Customer, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'identificacion_cliente',
    foreignKeyConstraintName: 'FK_ventas_cliente',
  })
  cliente: Customer;

  @ManyToOne(() => User, {
    nullable: true,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'id_usuario',
    foreignKeyConstraintName: 'FK_ventas_usuario',
  })
  usuario: User | null;

  @Column({ type: 'enum', enum: SaleChannel })
  canal: SaleChannel;

  @Column({
    name: 'fecha_hora',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaHora: Date;

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
    transformer: decimalTransformer,
  })
  total: number;

  @Column({
    type: 'enum',
    enum: SaleStatus,
    default: SaleStatus.PENDIENTE_PAGO,
  })
  estado: SaleStatus;

  @OneToMany(() => SaleDetail, (detail) => detail.venta, {
    cascade: ['insert'],
  })
  detalles: SaleDetail[];
}
