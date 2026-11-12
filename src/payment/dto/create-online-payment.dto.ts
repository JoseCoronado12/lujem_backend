import { OmitType } from '@nestjs/mapped-types';
import { CreatePaymentDto } from './create-payment.dto';

export class CreateOnlinePaymentDto extends OmitType(CreatePaymentDto, [
  'idVenta',
] as const) {}
