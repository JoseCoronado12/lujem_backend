import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../user/guards/roles.guard';
import { ProductController } from './product.controller';
import { Product } from './entities/product.entity';
import { ProductService } from './product.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [ProductController],
  providers: [ProductService, RolesGuard],
  exports: [ProductService],
})
export class ProductModule {}
