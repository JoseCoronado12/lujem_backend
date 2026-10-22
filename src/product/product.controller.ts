import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../user/decorators/roles.decorator';
import { RolesGuard } from '../user/guards/roles.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { ProductService } from './product.service';

@Controller('products')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto): Promise<Product> {
    return this.productService.create(createProductDto);
  }

  @Get()
  findAll(): Promise<Product[]> {
    return this.productService.findAll();
  }

  @Get(':codigoBarras')
  findOne(@Param('codigoBarras') codigoBarras: string): Promise<Product> {
    return this.productService.findOne(codigoBarras);
  }

  @Patch(':codigoBarras')
  update(
    @Param('codigoBarras') codigoBarras: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    return this.productService.update(codigoBarras, updateProductDto);
  }

  @Delete(':codigoBarras')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('codigoBarras') codigoBarras: string): Promise<void> {
    return this.productService.remove(codigoBarras);
  }
}
