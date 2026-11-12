import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerModule } from '../customer/customer.module';
import { RolesGuard } from '../user/guards/roles.guard';
import { ProductController } from './product.controller';
import { CustomerProductController } from './customer-product.controller';
import { Product } from './entities/product.entity';
import { ProductService } from './product.service';

@Module({
  imports: [CustomerModule, TypeOrmModule.forFeature([Product])],
  controllers: [ProductController, CustomerProductController],
  providers: [ProductService, RolesGuard],
  exports: [ProductService],
})
export class ProductModule {}
