import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerModule } from '../customer/customer.module';
import { RolesGuard } from '../user/guards/roles.guard';
import { ProductController } from './product.controller';
import { CustomerProductController } from './customer-product.controller';
import { Product } from './entities/product.entity';
import { ProductService } from './product.service';
import { ProductLot } from './entities/product-lot.entity';
import { InventoryMovement } from './entities/inventory-movement.entity';

@Module({
  imports: [CustomerModule, TypeOrmModule.forFeature([Product, ProductLot, InventoryMovement])],
  controllers: [ProductController, CustomerProductController],
  providers: [ProductService, RolesGuard],
  exports: [ProductService],
})
export class ProductModule {}
