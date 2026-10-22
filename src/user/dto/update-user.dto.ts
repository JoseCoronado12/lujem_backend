import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

// PartialType hace que todas las propiedades de CreateUserDto sean opcionales
export class UpdateUserDto extends PartialType(CreateUserDto) {
  // Campo opcional para actualizar el estado activo
  @IsBoolean({ message: 'isActive debe ser un valor booleano' })
  @IsOptional()
  isActive?: boolean;

  // Campo opcional para actualizar el rol (solo valores permitidos)
  @IsIn(['USER', 'ADMIN'], { message: 'El rol debe ser "USER" o "ADMIN"' })
  @IsOptional()
  role?: string;
}