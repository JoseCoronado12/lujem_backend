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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../user/decorators/roles.decorator';
import { RolesGuard } from '../user/guards/roles.guard';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { Supplier } from './entities/supplier.entity';
import { SupplierService } from './supplier.service';

@Controller('suppliers')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post()
  create(@Body() createSupplierDto: CreateSupplierDto): Promise<Supplier> {
    return this.supplierService.create(createSupplierDto);
  }

  @Get()
  findAll(): Promise<Supplier[]> {
    return this.supplierService.findAll();
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
