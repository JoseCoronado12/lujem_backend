import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BankAccountType } from './bank-account-type.enum';

@Entity('cuentas_bancarias')
export class BankAccount {
  @PrimaryGeneratedColumn({
    name: 'id_cuenta',
    type: 'smallint',
    unsigned: true,
  })
  id: number;

  @Column({ type: 'varchar', length: 100 })
  banco: string;

  @Column({ name: 'tipo_cuenta', type: 'enum', enum: BankAccountType })
  tipoCuenta: BankAccountType;

  @Column({ name: 'numero_cuenta', type: 'varchar', length: 50 })
  numeroCuenta: string;

  @Column({ type: 'varchar', length: 255 })
  titular: string;

  @Column({ type: 'boolean', default: true })
  activa: boolean;
}
