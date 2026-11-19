import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('turnos_caja')
export class CashRegisterSession {
  @PrimaryGeneratedColumn({ name: 'id_turno', type: 'bigint', unsigned: true })
  id: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_usuario', foreignKeyConstraintName: 'FK_turno_usuario' })
  usuario: User;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  apertura: Date;

  @Column({ name: 'monto_apertura', type: 'decimal', precision: 12, scale: 2 })
  montoApertura: number;

  @Column({ type: 'datetime', nullable: true })
  cierre: Date | null;

  @Column({ name: 'monto_contado', type: 'decimal', precision: 12, scale: 2, nullable: true })
  montoContado: number | null;

  @Column({ name: 'monto_esperado', type: 'decimal', precision: 12, scale: 2, nullable: true })
  montoEsperado: number | null;

  @Column({ name: 'diferencia', type: 'decimal', precision: 12, scale: 2, nullable: true })
  diferencia: number | null;

  @Column({ type: 'enum', enum: ['ABIERTA', 'CERRADA'], default: 'ABIERTA' })
  estado: 'ABIERTA' | 'CERRADA';

  @Column({ type: 'varchar', length: 255, nullable: true })
  observaciones: string | null;
}
