import { IsInt, IsNotEmpty, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateSaleDetailDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  codigoBarras: string;

  @IsInt()
  @Min(1)
  @Max(2147483647)
  cantidad: number;
}
