import { IsNumber, Max, Min } from 'class-validator';

export class RegisterPurchasePaymentDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(9999999999)
  monto: number;
}
