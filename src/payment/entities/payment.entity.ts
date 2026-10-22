import {
  Column,
  Entity,
  JoinColumn,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Sale } from '../../sale/entities/sale.entity';
import { User } from '../../user/entities/user.entity';
import { BankAccount } from './bank-account.entity';
import { PaymentMethod } from './payment-method.entity';
import { PaymentStatus } from './payment-status.enum';
import { TransferReceipt } from './transfer-receipt.entity';

const decimalTransformer = {
  to: (value: number | null): number | null => value,
  from: (value: string | null): number | null =>
    value === null ? null : Number(value),
};

@Entity('pagos')
@Index('IDX_pagos_venta', ['venta'])
@Index('IDX_pagos_metodo', ['metodo'])
@Index('IDX_pagos_cuenta', ['cuentaDestino'])
@Index('IDX_pagos_usuario', ['usuario'])
export class Payment {
  @PrimaryGeneratedColumn({ name: 'id_pago', type: 'int' })
  id: number;

  @ManyToOne(() => Sale, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'id_venta', foreignKeyConstraintName: 'FK_pagos_venta' })
  venta: Sale;

  @ManyToOne(() => PaymentMethod, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'id_metodo_pago',
    foreignKeyConstraintName: 'FK_pagos_metodo',
  })
  metodo: PaymentMethod;

  @ManyToOne(() => BankAccount, {
    nullable: true,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'id_cuenta_destino',
    foreignKeyConstraintName: 'FK_pagos_cuenta',
  })
  cuentaDestino: BankAccount | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  monto: number;

  @Column({
    name: 'monto_recibido',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    default: null,
    transformer: decimalTransformer,
  })
  montoRecibido: number | null;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    default: null,
    transformer: decimalTransformer,
  })
  cambio: number | null;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDIENTE,
  })
  estado: PaymentStatus;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'id_usuario', foreignKeyConstraintName: 'FK_pagos_usuario' })
  usuario: User;

  @Column({
    name: 'fecha_registro',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaRegistro: Date;

  @Column({
    name: 'fecha_aprobacion',
    type: 'datetime',
    nullable: true,
    default: null,
  })
  fechaAprobacion: Date | null;

  @OneToMany(() => TransferReceipt, (receipt) => receipt.pago, {
    cascade: ['insert'],
  })
  comprobantes: TransferReceipt[];
}
