import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../product/entities/product.entity';
import { Supplier } from '../supplier/entities/supplier.entity';
import { RolesGuard } from '../user/guards/roles.guard';
import { User } from '../user/entities/user.entity';
import { PurchaseOrderDetail } from './entities/purchase-order-detail.entity';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderController } from './purchase-order.controller';
import { PurchaseOrderService } from './purchase-order.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PurchaseOrder,
      PurchaseOrderDetail,
      Product,
      Supplier,
      User,
    ]),
  ],
  controllers: [PurchaseOrderController],
  providers: [PurchaseOrderService, RolesGuard],
  exports: [PurchaseOrderService],
})
export class PurchaseOrderModule {}
