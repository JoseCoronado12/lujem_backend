import {
  Body,
  Controller,
  Get,
  Post,
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

  @Get('me')
  @UseGuards(AuthGuard('customer-jwt'))
  getProfile(
    @Req() request: Request & { user: Customer },
  ): CustomerAuthResponse['customer'] {
    const { identificacion, correo, nombres, apellidos } = request.user;
    return { identificacion, correo, nombres, apellidos };
  }
}
