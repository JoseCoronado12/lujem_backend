import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Customer } from '../../customer/entities/customer.entity';
import { Sale } from './sale.entity';
import { User } from '../../user/entities/user.entity';

@Entity('formulas_medicas')
export class Prescription {
  @PrimaryGeneratedColumn({ name: 'id_formula', type: 'bigint', unsigned: true })
  id: string;

  @ManyToOne(() => Sale, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_venta', foreignKeyConstraintName: 'FK_formula_venta' })
  venta: Sale;

  @ManyToOne(() => Customer, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'identificacion_cliente', foreignKeyConstraintName: 'FK_formula_cliente' })
  cliente: Customer;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_usuario', foreignKeyConstraintName: 'FK_formula_usuario' })
  usuario: User;

  @Column({ name: 'numero_formula', type: 'varchar', length: 100 })
  numeroFormula: string;

  @Column({ name: 'nombre_medico', type: 'varchar', length: 255 })
  nombreMedico: string;

  @Column({ name: 'fecha_formula', type: 'date' })
  fechaFormula: string;

  @Column({ name: 'tipo_control', type: 'enum', enum: ['NINGUNO', 'CONTROLADO', 'PSICOTROPICO'] })
  tipoControl: 'NINGUNO' | 'CONTROLADO' | 'PSICOTROPICO';

  @Column({ name: 'archivo_url', type: 'varchar', length: 500, nullable: true })
  archivoUrl: string | null;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  fechaRegistro: Date;
}
