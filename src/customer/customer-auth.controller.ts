import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { CustomerAuthResponse } from './interfaces/customer-auth-response.interface';
import { Customer } from './entities/customer.entity';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerLoginDto } from './dto/customer-login.dto';
import { CustomerRegistrationDto } from './dto/customer-registration.dto';
import {
  RefreshTokenDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from '../auth/dto/account-recovery.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('customer-auth')
export class CustomerAuthController {
  constructor(private readonly customerAuthService: CustomerAuthService) {}

  @Post('register')
  register(
    @Body() dto: CustomerRegistrationDto,
  ): Promise<CustomerAuthResponse> {
    return this.customerAuthService.register(dto);
  }

  @Post('login')
  login(@Body() dto: CustomerLoginDto): Promise<CustomerAuthResponse> {
    return this.customerAuthService.login(dto);
  }

  @Post('password-reset/request')
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.customerAuthService.requestPasswordReset(dto.email);
  }

  @Post('password-reset')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.customerAuthService.resetPassword(
      dto.email,
      dto.token,
      dto.password,
    );
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.customerAuthService.refresh(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(AuthGuard('customer-jwt'))
  getProfile(
    @Req() request: Request & { user: Customer },
  ): CustomerAuthResponse['customer'] {
    const {
      identificacion,
      correo,
      nombres,
      apellidos,
      emailVerificado,
    } = request.user;
    return {
      identificacion,
      correo,
      nombres,
      apellidos,
      emailVerificado,
    } as CustomerAuthResponse['customer'];
  }

  @Patch('me')
  @UseGuards(AuthGuard('customer-jwt'))
  updateProfile(
    @Req() request: Request & { user: Customer },
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customerAuthService.updateProfile(
      request.user.identificacion,
      dto,
    );
  }

  @Post('email-verification/request')
  requestEmailVerification(@Body() dto: RequestPasswordResetDto) {
    return this.customerAuthService.requestEmailVerification(dto.email);
  }

  @Post('email-verification')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.customerAuthService.verifyEmail(dto.email, dto.token);
  }
}
