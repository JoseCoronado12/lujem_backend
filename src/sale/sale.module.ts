import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerModule } from '../customer/customer.module';
import { Customer } from '../customer/entities/customer.entity';
import { Product } from '../product/entities/product.entity';
import { RolesGuard } from '../user/guards/roles.guard';
import { User } from '../user/entities/user.entity';
import { Invoice } from '../invoice/entities/invoice.entity';
import { SaleDetail } from './entities/sale-detail.entity';
import { Sale } from './entities/sale.entity';
import { SaleController } from './sale.controller';
import { CustomerSaleController } from './customer-sale.controller';
import { SaleService } from './sale.service';

@Module({
  imports: [
    CustomerModule,
    TypeOrmModule.forFeature([
      Sale,
      SaleDetail,
      Customer,
      Product,
      User,
      Invoice,
    ]),
  ],
  controllers: [SaleController, CustomerSaleController],
  providers: [SaleService, RolesGuard],
  exports: [SaleService],
})
export class SaleModule {}
