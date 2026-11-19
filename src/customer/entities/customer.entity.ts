import { Exclude } from 'class-transformer';
import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

export enum DocumentType {
  CC = 'CC',
  CE = 'CE',
  TI = 'TI',
  PASAPORTE = 'PASAPORTE',
  NIT = 'NIT',
  OTRO = 'OTRO',
}

@Entity('clientes')
@Index('IDX_clientes_correo', ['correo'], { unique: true })
export class Customer {
  @PrimaryColumn({ name: 'identificacion', type: 'varchar', length: 30 })
  identificacion: string;

  @Column({ name: 'tipo_documento', type: 'enum', enum: DocumentType })
  tipoDocumento: DocumentType;

  @Column({ type: 'varchar', length: 255 })
  nombres: string;

  @Column({ type: 'varchar', length: 255 })
  apellidos: string;

  @Column({ type: 'varchar', length: 255 })
  correo: string;

  @Column({ type: 'varchar', length: 30 })
  telefono: string;

  @Column({ type: 'varchar', length: 255 })
  direccion: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Exclude()
  @Column({
    name: 'contrasena_hash',
    type: 'varchar',
    length: 255,
    nullable: true,
    default: null,
    select: false,
  })
  contrasenaHash: string | null;

  @Exclude()
  @Column({ name: 'refresh_token_hash', type: 'varchar', length: 255, nullable: true, select: false })
  refreshTokenHash: string | null;

  @Exclude()
  @Column({ name: 'reset_token_hash', type: 'varchar', length: 255, nullable: true, select: false })
  resetTokenHash: string | null;

  @Column({ name: 'reset_token_expires', type: 'datetime', nullable: true })
  resetTokenExpires: Date | null;

  @Column({ name: 'email_verificado', type: 'boolean', default: false })
  emailVerificado: boolean;
}
