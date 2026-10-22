import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('proveedores')
@Index('IDX_proveedores_nit', ['nit'], { unique: true })
export class Supplier {
  @PrimaryGeneratedColumn({ name: 'codigo_proveedor', type: 'int' })
  codigoProveedor: number;

  @Column({ type: 'varchar', length: 20 })
  nit: string;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'varchar', length: 30 })
  telefono: string;

  @Column({ type: 'varchar', length: 255 })
  correo: string;

  @Column({ type: 'varchar', length: 255 })
  direccion: string;

  @Column({ name: 'fecha_contrato', type: 'date' })
  fechaContrato: string;
}
