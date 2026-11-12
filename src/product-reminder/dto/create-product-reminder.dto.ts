import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductReminderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  identificacionCliente: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  codigoBarras: string;

  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  fechaRecordatorio: string;

  @IsInt()
  @Min(1)
  @Max(32767)
  frecuenciaDias: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  mensaje: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
