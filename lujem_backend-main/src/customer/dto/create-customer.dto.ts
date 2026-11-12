import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { DocumentType } from '../entities/customer.entity';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  identificacion: string;

  @IsEnum(DocumentType)
  tipoDocumento: DocumentType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombres: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  apellidos: string;

  @IsEmail()
  @MaxLength(255)
  correo: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  telefono: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  direccion: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  contrasena?: string;
}
