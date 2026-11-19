import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import type { User } from '../user/entities/user.entity';
import { Roles } from '../user/decorators/roles.decorator';
import { RolesGuard } from '../user/guards/roles.guard';
import { CreateSaleDto } from './dto/create-sale.dto';
import { Sale } from './entities/sale.entity';
import { SaleService } from './sale.service';
import { DeliverSaleDto, ReturnSaleDto, VoidSaleDto } from './dto/sale-state.dto';
import { PrescriptionDto } from './dto/prescription.dto';

@Controller('sales')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'CAJERO', 'REGENTE')
export class SaleController {
  constructor(private readonly saleService: SaleService) {}

  @Post()
  create(
    @Body() createDto: CreateSaleDto,
    @Req() request: Request & { user: User },
  ): Promise<Sale> {
    return this.saleService.create(createDto, request.user.id);
  }

  @Get()
  findAll(): Promise<Sale[]> {
    return this.saleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Sale> {
    return this.saleService.findOne(id);
  }

  @Patch(':id/deliver')
  deliver(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DeliverSaleDto,
  ): Promise<Sale> {
    return this.saleService.deliver(id, dto);
  }

  @Patch(':id/void')
  void(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: VoidSaleDto,
  ): Promise<Sale> {
    return this.saleService.voidSale(id, dto);
  }

  @Patch(':id/return')
  return(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReturnSaleDto,
  ): Promise<Sale> {
    return this.saleService.returnSale(id, dto);
  }

  @Post(':id/prescription')
  registerPrescription(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PrescriptionDto,
    @Req() req: Request & { user: User },
  ) {
    return this.saleService.registerPrescription(id, dto, req.user.id);
  }
}
