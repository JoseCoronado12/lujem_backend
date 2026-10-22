import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '../customer/entities/customer.entity';
import { Product } from '../product/entities/product.entity';
import { RolesGuard } from '../user/guards/roles.guard';
import { User } from '../user/entities/user.entity';
import { SaleDetail } from './entities/sale-detail.entity';
import { Sale } from './entities/sale.entity';
import { SaleController } from './sale.controller';
import { SaleService } from './sale.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sale, SaleDetail, Customer, Product, User]),
  ],
  controllers: [SaleController],
  providers: [SaleService, RolesGuard],
  exports: [SaleService],
})
export class SaleModule {}
