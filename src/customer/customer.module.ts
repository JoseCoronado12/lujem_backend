import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../user/guards/roles.guard';
import { Sale } from '../sale/entities/sale.entity';
import { CustomerController } from './customer.controller';
import { Customer } from './entities/customer.entity';
import { CustomerService } from './customer.service';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, Sale])],
  controllers: [CustomerController],
  providers: [CustomerService, RolesGuard],
  exports: [CustomerService],
})
export class CustomerModule {}
