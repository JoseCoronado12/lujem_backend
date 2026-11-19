import {
  Controller,
  Get,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Product } from './entities/product.entity';
import { ProductService } from './product.service';
import { PublicCatalogQueryDto } from './dto/public-catalog-query.dto';

@Controller('customer/products')
@UseGuards(AuthGuard('customer-jwt'))
export class CustomerProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  findAll(@Query() query: PublicCatalogQueryDto) {
    return this.productService.findPublicCatalog(query);
  }

  @Get(':codigoBarras')
  findOne(@Param('codigoBarras') codigoBarras: string): Promise<Product> {
    return this.productService.findOne(codigoBarras);
  }
}
