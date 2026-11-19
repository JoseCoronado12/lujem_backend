import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Role } from './role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: false })
  email: string;

  @Exclude()
  @Column({ nullable: false, select: false })
  password: string;

  @Column({ nullable: false })
  nombres: string;

  @Column({ nullable: false })
  apellidos: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @ManyToOne(() => Role, (role) => role.users, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'id_rol',
    foreignKeyConstraintName: 'FK_users_roles_id_rol',
  })
  role: Role;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

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