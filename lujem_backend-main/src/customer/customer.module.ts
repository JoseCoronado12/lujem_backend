import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../user/guards/roles.guard';
import { Sale } from '../sale/entities/sale.entity';
import { CustomerController } from './customer.controller';
import { CustomerAuthController } from './customer-auth.controller';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerJwtStrategy } from './customer-jwt.strategy';
import { Customer } from './entities/customer.entity';
import { CustomerService } from './customer.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, Sale]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [CustomerController, CustomerAuthController],
  providers: [
    CustomerService,
    CustomerAuthService,
    CustomerJwtStrategy,
    RolesGuard,
  ],
  exports: [CustomerService, CustomerJwtStrategy],
})
export class CustomerModule {}
