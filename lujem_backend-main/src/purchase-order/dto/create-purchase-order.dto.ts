import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PurchaseOrderDetailDto } from './purchase-order-detail.dto';

export class CreatePurchaseOrderDto {
  @IsInt()
  @Min(1)
  @Max(2147483647)
  codigoProveedor: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  observaciones?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderDetailDto)
  detalles: PurchaseOrderDetailDto[];
}
