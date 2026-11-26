import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Customer } from './entities/customer.entity';
import { CustomerAuthResponse } from './interfaces/customer-auth-response.interface';
import { CustomerJwtPayload } from './interfaces/customer-jwt-payload.interface';
import { CustomerService } from './customer.service';
import { CustomerLoginDto } from './dto/customer-login.dto';
import { CustomerRegistrationDto } from './dto/customer-registration.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

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
      !customer?.activo ||
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
    const refreshToken =
      await this.customerService.issueRefreshToken(customer);

    return {
      customer: {
        identificacion: customer.identificacion,
        correo: customer.correo,
        nombres: customer.nombres,
        apellidos: customer.apellidos,
        emailVerificado: customer.emailVerificado,
      },
      token,
      refreshToken,
    };
  }

  async requestPasswordReset(correo: string): Promise<{ message: string }> {
    await this.customerService.requestPasswordReset(correo);
    return {
      message:
        'Si el correo existe, se enviará un enlace de recuperación.',
    };
  }

  async resetPassword(
    correo: string,
    token: string,
    password: string,
  ): Promise<{ message: string }> {
    await this.customerService.resetPassword(correo, token, password);
    return { message: 'Contraseña actualizada correctamente.' };
  }

  async refresh(refreshToken: string): Promise<CustomerAuthResponse> {
    const customer =
      await this.customerService.refreshCustomer(refreshToken);
    return await this.buildResponse(customer);
  }

  async requestEmailVerification(correo: string): Promise<{ message: string }> {
    await this.customerService.requestEmailVerification(correo);
    return {
      message:
        'Si el correo existe y no está verificado, se enviará un enlace de verificación.',
    };
  }

  async verifyEmail(correo: string, token: string): Promise<{ message: string }> {
    await this.customerService.verifyEmail(correo, token);
    return { message: 'Correo verificado correctamente.' };
  }

  async updateProfile(
    identificacion: string,
    dto: UpdateCustomerDto,
  ): Promise<Customer> {
    return await this.customerService.update(identificacion, dto);
  }
}
