import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class PrescriptionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  numeroFormula: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombreMedico: string;

  @IsString()
  fechaFormula: string;

  @IsEnum(['NINGUNO', 'CONTROLADO', 'PSICOTROPICO'])
  tipoControl: 'NINGUNO' | 'CONTROLADO' | 'PSICOTROPICO';

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  archivoUrl?: string;
}
