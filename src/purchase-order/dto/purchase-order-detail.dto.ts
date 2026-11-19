import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class PurchaseOrderDetailDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  codigoBarras: string;

  @IsInt()
  @Min(1)
  @Max(2147483647)
  cantidad: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(99999999.99)
  costoUnitario: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lote?: string;

  @IsOptional()
  @IsString()
  fechaVencimiento?: string;
}
