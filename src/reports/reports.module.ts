import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sale } from '../sale/entities/sale.entity';
import { PurchaseOrder } from '../purchase-order/entities/purchase-order.entity';
import { Product } from '../product/entities/product.entity';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { RolesGuard } from '../user/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Sale, PurchaseOrder, Product])],
  controllers: [ReportsController],
  providers: [ReportsService, RolesGuard],
})
export class ReportsModule {}
