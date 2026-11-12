import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
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

@Controller('sales')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
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
}
