import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('lotes_producto')
@Index('IDX_lotes_producto_vencimiento', ['fechaVencimiento'])
export class ProductLot {
  @PrimaryGeneratedColumn({ name: 'id_lote', type: 'bigint', unsigned: true })
  id: string;

  @ManyToOne(() => Product, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'codigo_barras',
    foreignKeyConstraintName: 'FK_lotes_producto',
  })
  producto: Product;

  @Column({ type: 'varchar', length: 100 })
  lote: string;

  @Column({ name: 'fecha_vencimiento', type: 'date' })
  fechaVencimiento: string;

  @Column({ type: 'int', default: 0 })
  cantidad: number;

  @Column({
    name: 'costo_unitario',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  costoUnitario: number;

  @Column({ name: 'activo', type: 'boolean', default: true })
  activo: boolean;
}
