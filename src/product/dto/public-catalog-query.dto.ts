import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class PublicCatalogQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  laboratorio?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  onlyAvailable?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  categoria?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  principioActivo?: string;
}
