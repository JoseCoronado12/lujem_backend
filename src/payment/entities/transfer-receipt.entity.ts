import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Payment } from './payment.entity';

@Entity('comprobantes_transferencia')
@Index('IDX_comprobantes_pago', ['pago'])
export class TransferReceipt {
  @PrimaryGeneratedColumn({ name: 'id_comprobante', type: 'int' })
  id: number;

  @ManyToOne(() => Payment, (payment) => payment.comprobantes, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'id_pago',
    foreignKeyConstraintName: 'FK_comprobantes_pago',
  })
  pago: Payment;

  @Column({ name: 'ruta_imagen', type: 'varchar', length: 255 })
  @Exclude()
  cloudinaryPublicId: string;

  @Column({ name: 'nombre_archivo', type: 'varchar', length: 255 })
  nombreArchivo: string;

  @Column({ name: 'tipo_mime', type: 'varchar', length: 100 })
  tipoMime: string;

  @Column({ name: 'tamano_bytes', type: 'int' })
  tamanoBytes: number;

  @Column({ name: 'hash_sha256', type: 'char', length: 64 })
  hashSha256: string;

  @Column({ name: 'banco_origen', type: 'varchar', length: 100 })
  bancoOrigen: string;

  @Column({ name: 'numero_referencia', type: 'varchar', length: 100 })
  numeroReferencia: string;

  @Column({ name: 'fecha_transferencia', type: 'datetime' })
  fechaTransferencia: Date;

  @Column({
    name: 'fecha_carga',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaCarga: Date;
}
