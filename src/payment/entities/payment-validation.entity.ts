import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { TransferReceipt } from './transfer-receipt.entity';
import { PaymentStatus } from './payment-status.enum';

@Entity('validaciones_pago')
@Index('IDX_validaciones_comprobante', ['comprobante'], { unique: true })
@Index('IDX_validaciones_usuario', ['usuario'])
export class PaymentValidation {
  @PrimaryGeneratedColumn({ name: 'id_validacion', type: 'int' })
  id: number;

  @ManyToOne(() => TransferReceipt, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'id_comprobante',
    foreignKeyConstraintName: 'FK_validaciones_comprobante',
  })
  comprobante: TransferReceipt;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'id_usuario',
    foreignKeyConstraintName: 'FK_validaciones_usuario',
  })
  usuario: User;

  @Column({
    type: 'enum',
    enum: [PaymentStatus.APROBADO, PaymentStatus.RECHAZADO],
  })
  resultado: PaymentStatus.APROBADO | PaymentStatus.RECHAZADO;

  @Column({
    name: 'motivo_rechazo',
    type: 'varchar',
    length: 255,
    nullable: true,
    default: null,
  })
  motivoRechazo: string | null;

  @Column({
    name: 'fecha_validacion',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaValidacion: Date;
}
