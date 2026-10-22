import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { SaleChannel } from '../entities/sale-channel.enum';
import { CreateSaleDetailDto } from './create-sale-detail.dto';

export class CreateSaleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  identificacionCliente: string;

  @IsEnum(SaleChannel)
  canal: SaleChannel;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99999999.99)
  descuento?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSaleDetailDto)
  detalles: CreateSaleDetailDto[];
}
