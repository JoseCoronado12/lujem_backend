import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  codigoBarras: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombreProducto: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  laboratorio: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  presentacion: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  registroInvima: string;

  @IsBoolean()
  requiereFormula: boolean;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(99999999.99)
  valorUnitario: number;

  @IsInt()
  @Min(0)
  stock: number;

  @IsInt()
  @Min(0)
  stockMinimo: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lote: string;

  @IsDateString()
  fechaVencimiento: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  ubicacion: string;
}
