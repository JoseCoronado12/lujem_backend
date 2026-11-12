import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { CreateSaleDetailDto } from './create-sale-detail.dto';

export class CreateOnlineSaleDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSaleDetailDto)
  detalles: CreateSaleDetailDto[];
}
