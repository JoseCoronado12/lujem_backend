import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class DeliverSaleDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  observaciones?: string;
}

export class VoidSaleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  motivo: string;
}

export class ReturnSaleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  motivo: string;

  @IsOptional()
  @IsIn(['TOTAL', 'PARCIAL'])
  tipo?: 'TOTAL' | 'PARCIAL';
}
