import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class CreatePaymentDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2147483647)
  idVenta: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(255)
  idMetodoPago: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(99999999.99)
  monto: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99999999.99)
  montoRecibido?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  idCuentaDestino?: number;
}
