import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Customer } from './entities/customer.entity';
import { CustomerAuthResponse } from './interfaces/customer-auth-response.interface';
import { CustomerJwtPayload } from './interfaces/customer-jwt-payload.interface';
import { CustomerService } from './customer.service';
import { CustomerLoginDto } from './dto/customer-login.dto';
import { CustomerRegistrationDto } from './dto/customer-registration.dto';

@Injectable()
export class CustomerAuthService {
  constructor(
    private readonly customerService: CustomerService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: CustomerRegistrationDto): Promise<CustomerAuthResponse> {
    const customer = await this.customerService.create(dto);
    return await this.buildResponse(customer);
  }

  async login(dto: CustomerLoginDto): Promise<CustomerAuthResponse> {
    const customer = await this.customerService.findForAuthentication(
      dto.correo,
    );
    if (
      !customer?.contrasenaHash ||
      !(await bcrypt.compare(dto.contrasena, customer.contrasenaHash))
    ) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return await this.buildResponse(customer);
  }

  private async buildResponse(
    customer: Customer,
  ): Promise<CustomerAuthResponse> {
    const payload: CustomerJwtPayload = {
      sub: customer.identificacion,
      correo: customer.correo,
      kind: 'customer',
    };
    const token = await this.jwtService.signAsync(payload);

    return {
      customer: {
        identificacion: customer.identificacion,
        correo: customer.correo,
        nombres: customer.nombres,
        apellidos: customer.apellidos,
      },
      token,
    };
  }
}
