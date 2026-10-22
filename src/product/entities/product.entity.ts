import { Column, Entity, PrimaryColumn } from 'typeorm';

const decimalTransformer = {
  to: (value: number): number => value,
  from: (value: string): number => Number(value),
};

@Entity('productos')
export class Product {
  @PrimaryColumn({ name: 'codigo_barras', type: 'varchar', length: 100 })
  codigoBarras: string;

  @Column({ name: 'nombre_producto', type: 'varchar', length: 255 })
  nombreProducto: string;

  @Column({ type: 'varchar', length: 255 })
  laboratorio: string;

  @Column({ type: 'varchar', length: 255 })
  presentacion: string;

  @Column({ name: 'registro_invima', type: 'varchar', length: 100 })
  registroInvima: string;

  @Column({ name: 'requiere_formula', type: 'boolean', default: false })
  requiereFormula: boolean;

  @Column({
    name: 'valor_unitario',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  valorUnitario: number;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ name: 'stock_minimo', type: 'int', default: 0 })
  stockMinimo: number;

  @Column({ type: 'varchar', length: 100 })
  lote: string;

  @Column({ name: 'fecha_vencimiento', type: 'date' })
  fechaVencimiento: string;

  @Column({ type: 'varchar', length: 100 })
  ubicacion: string;
}
