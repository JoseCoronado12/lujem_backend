import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../user/decorators/roles.decorator';
import { RolesGuard } from '../user/guards/roles.guard';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { Supplier } from './entities/supplier.entity';
import { SupplierService } from './supplier.service';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('suppliers')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'BODEGA')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post()
  create(@Body() createSupplierDto: CreateSupplierDto): Promise<Supplier> {
    return this.supplierService.create(createSupplierDto);
  }

  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.supplierService.findPaginated(
      query.page,
      query.limit,
      query.search,
    );
  }

  @Get(':codigoProveedor')
  findOne(
    @Param('codigoProveedor', ParseIntPipe) codigoProveedor: number,
  ): Promise<Supplier> {
    return this.supplierService.findOne(codigoProveedor);
  }

  @Patch(':codigoProveedor')
  update(
    @Param('codigoProveedor', ParseIntPipe) codigoProveedor: number,
    @Body() updateSupplierDto: UpdateSupplierDto,
  ): Promise<Supplier> {
    return this.supplierService.update(codigoProveedor, updateSupplierDto);
  }

  @Delete(':codigoProveedor')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('codigoProveedor', ParseIntPipe) codigoProveedor: number,
  ): Promise<void> {
    return this.supplierService.remove(codigoProveedor);
  }
}
