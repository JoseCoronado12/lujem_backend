import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CustomerLoginDto {
  @IsEmail()
  @MaxLength(255)
  correo: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  contrasena: string;
}
