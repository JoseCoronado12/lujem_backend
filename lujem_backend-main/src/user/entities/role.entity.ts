import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('roles')
@Index('IDX_roles_nombre', ['nombre'], { unique: true })
export class Role {
  @PrimaryGeneratedColumn({ type: 'tinyint', name: 'id_rol', unsigned: true })
  id: number;

  @Column({ name: 'nombre', type: 'varchar', length: 50 })
  nombre: string;

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
