import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Sale } from '../../sale/entities/sale.entity';

const decimalTransformer = {
  to: (value: number): number => value,
  from: (value: string): number => Number(value),
};

@Entity('factura_venta')
@Index('IDX_factura_venta_numero', ['numeroFactura'], { unique: true })
@Index('IDX_factura_venta_venta', ['venta'], { unique: true })
export class Invoice {
  @PrimaryGeneratedColumn({ name: 'id_factura', type: 'int' })
  id: number;

  @Column({ name: 'numero_factura', type: 'varchar', length: 30 })
  numeroFactura: string;

  @OneToOne(() => Sale, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'id_venta',
    foreignKeyConstraintName: 'FK_factura_venta_venta',
  })
  venta: Sale;

  @Column({
    name: 'fecha_emision',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  fechaEmision: Date;

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
    default: 0,
    transformer: decimalTransformer,
  })
  impuestos: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  total: number;

  @Column({
    name: 'estado_electronico',
    type: 'enum',
    enum: ['NO_ENVIADA', 'ENVIADA', 'ACEPTADA', 'RECHAZADA'],
    default: 'NO_ENVIADA',
  })
  estadoElectronico: 'NO_ENVIADA' | 'ENVIADA' | 'ACEPTADA' | 'RECHAZADA';

  @Column({ type: 'varchar', length: 255, nullable: true })
  cufe: string | null;

  @Column({ name: 'xml_url', type: 'varchar', length: 500, nullable: true })
  xmlUrl: string | null;

  @Column({ name: 'respuesta_proveedor', type: 'text', nullable: true })
  respuestaProveedor: string | null;

  @Column({ name: 'fecha_electronica', type: 'datetime', nullable: true })
  fechaElectronica: Date | null;
}
