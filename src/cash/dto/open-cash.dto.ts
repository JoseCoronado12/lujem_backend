import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class OpenCashDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  montoApertura: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  observaciones?: string;
}

export class CloseCashDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  montoContado: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  observaciones?: string;
}
