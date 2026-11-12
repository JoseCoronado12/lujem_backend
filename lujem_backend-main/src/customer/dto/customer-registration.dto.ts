import { OmitType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { CreateCustomerDto } from './create-customer.dto';

export class CustomerRegistrationDto extends OmitType(CreateCustomerDto, [
  'contrasena',
] as const) {
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(72)
  contrasena: string;
}
