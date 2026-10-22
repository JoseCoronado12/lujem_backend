import {
  IsDateString,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class TransferReceiptDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  bancoOrigen: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  numeroReferencia: string;

  @IsDateString()
  fechaTransferencia: string;
}
