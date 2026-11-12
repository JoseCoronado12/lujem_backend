import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('metodos_pago')
@Index('IDX_metodos_pago_nombre', ['nombre'], { unique: true })
export class PaymentMethod {
  @PrimaryGeneratedColumn({
    name: 'id_metodo_pago',
    type: 'tinyint',
    unsigned: true,
  })
  id: number;

  @Column({ type: 'varchar', length: 30 })
  nombre: string;

  @Column({ name: 'requiere_comprobante', type: 'boolean', default: false })
  requiereComprobante: boolean;
}
