import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Product } from './entities/product.entity';
import { ProductService } from './product.service';

@Controller('customer/products')
@UseGuards(AuthGuard('customer-jwt'))
export class CustomerProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  findAll(): Promise<Product[]> {
    return this.productService.findAll();
  }

  @Get(':codigoBarras')
  findOne(@Param('codigoBarras') codigoBarras: string): Promise<Product> {
    return this.productService.findOne(codigoBarras);
  }
}
