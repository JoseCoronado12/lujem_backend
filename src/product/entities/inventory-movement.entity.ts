import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { User } from '../../user/entities/user.entity';

export type InventoryMovementType =
  | 'ENTRADA'
  | 'SALIDA'
  | 'AJUSTE'
  | 'MERMA'
  | 'DEVOLUCION';

@Entity('movimientos_inventario')
@Index('IDX_movimientos_producto', ['producto'])
@Index('IDX_movimientos_fecha', ['fecha'])
export class InventoryMovement {
  @PrimaryGeneratedColumn({ name: 'id_movimiento', type: 'bigint', unsigned: true })
  id: string;

  @ManyToOne(() => Product, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'codigo_barras', foreignKeyConstraintName: 'FK_movimiento_producto' })
  producto: Product;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_usuario', foreignKeyConstraintName: 'FK_movimiento_usuario' })
  usuario: User;

  @Column({ type: 'enum', enum: ['ENTRADA', 'SALIDA', 'AJUSTE', 'MERMA', 'DEVOLUCION'] })
  tipo: InventoryMovementType;

  @Column({ type: 'int' })
  cantidad: number;

  @Column({ name: 'stock_anterior', type: 'int' })
  stockAnterior: number;

  @Column({ name: 'stock_nuevo', type: 'int' })
  stockNuevo: number;

  @Column({ type: 'varchar', length: 255 })
  motivo: string;

  @Column({ name: 'referencia', type: 'varchar', length: 100, nullable: true })
  referencia: string | null;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fecha: Date;
}
