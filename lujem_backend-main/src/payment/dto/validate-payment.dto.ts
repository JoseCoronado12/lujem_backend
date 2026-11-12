import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PaymentStatus } from '../entities/payment-status.enum';

export class ValidatePaymentDto {
  @IsInt()
  @Min(1)
  @Max(2147483647)
  idComprobante: number;

  @IsIn([PaymentStatus.APROBADO, PaymentStatus.RECHAZADO])
  resultado: PaymentStatus.APROBADO | PaymentStatus.RECHAZADO;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  motivoRechazo?: string;
}
