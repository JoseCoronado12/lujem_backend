import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('auditoria')
export class Audit {
  @PrimaryGeneratedColumn({ name: 'id_auditoria', type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'actor_tipo', type: 'enum', enum: ['STAFF', 'CUSTOMER', 'SYSTEM'] })
  actorTipo: 'STAFF' | 'CUSTOMER' | 'SYSTEM';

  @Column({ name: 'actor_id', type: 'varchar', length: 100, nullable: true })
  actorId: string | null;

  @Column({ type: 'varchar', length: 100 })
  accion: string;

  @Column({ type: 'varchar', length: 100 })
  entidad: string;

  @Column({ name: 'entidad_id', type: 'varchar', length: 100, nullable: true })
  entidadId: string | null;

  @Column({ name: 'datos_antes', type: 'longtext', nullable: true })
  datosAntes: string | null;

  @Column({ name: 'datos_despues', type: 'longtext', nullable: true })
  datosDespues: string | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip: string | null;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecha: Date;
}
