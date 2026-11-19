import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class AdjustStockDto {
  @IsInt()
  @Min(1)
  cantidad: number;

  @IsEnum(['ENTRADA', 'SALIDA', 'AJUSTE', 'MERMA', 'DEVOLUCION'])
  tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'MERMA' | 'DEVOLUCION';

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  motivo: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  referencia?: string;
}
