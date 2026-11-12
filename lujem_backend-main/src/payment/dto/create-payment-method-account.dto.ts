import {
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';
import { BankAccountType } from '../entities/bank-account-type.enum';

export class CreateBankAccountDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  banco: string;

  @IsEnum(BankAccountType)
  tipoCuenta: BankAccountType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  numeroCuenta: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  titular: string;
}
