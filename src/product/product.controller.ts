import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Param,
  Patch,
  Post,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../user/decorators/roles.decorator';
import { RolesGuard } from '../user/guards/roles.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { ProductService } from './product.service';
import type { Request } from 'express';
import type { User } from '../user/entities/user.entity';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('products')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'BODEGA', 'REGENTE')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto): Promise<Product> {
    return this.productService.create(createProductDto);
  }

  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.productService.findPaginated(
      query.page,
      query.limit,
      query.search,
    );
  }

  @Get('low-stock')
  findLowStock(): Promise<Product[]> {
    return this.productService.findLowStock();
  }

  @Get('expiring/:days')
  findExpiring(@Param('days') days: string): Promise<unknown[]> {
    const parsed = Number(days);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 365) {
      throw new BadRequestException('El número de días debe estar entre 1 y 365');
    }
    return this.productService.findExpiring(parsed);
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

  @Post(':codigoBarras/adjust-stock')
  adjustStock(
    @Param('codigoBarras') codigoBarras: string,
    @Body() dto: AdjustStockDto,
    @Req() req: Request & { user: User },
  ) {
    return this.productService.adjustStock(codigoBarras, dto, req.user.id);
  }

  @Get('movements/all')
  findMovements() {
    return this.productService.findMovements();
  }

  @Get(':codigoBarras/movements')
  findProductMovements(@Param('codigoBarras') codigoBarras: string) {
    return this.productService.findMovements(codigoBarras);
  }

  @Delete(':codigoBarras')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('codigoBarras') codigoBarras: string): Promise<void> {
    return this.productService.remove(codigoBarras);
  }
}
