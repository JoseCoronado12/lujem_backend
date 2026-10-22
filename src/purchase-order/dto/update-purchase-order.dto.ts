import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PurchaseOrderStatus } from '../purchase-order-status.enum';
import { PurchaseOrderDetailDto } from './purchase-order-detail.dto';

export class UpdatePurchaseOrderDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2147483647)
  codigoProveedor?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  observaciones?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderDetailDto)
  detalles?: PurchaseOrderDetailDto[];

  @IsOptional()
  @IsEnum(PurchaseOrderStatus)
  estado?: PurchaseOrderStatus;
}
