import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { Customer } from '../customer/entities/customer.entity';
import { CreateOnlineSaleDto } from './dto/create-online-sale.dto';
import { Sale } from './entities/sale.entity';
import { SaleService } from './sale.service';
import { Invoice } from '../invoice/entities/invoice.entity';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('customer/sales')
@UseGuards(AuthGuard('customer-jwt'))
export class CustomerSaleController {
  constructor(private readonly saleService: SaleService) {}

  @Post()
  create(
    @Body() createDto: CreateOnlineSaleDto,
    @Req() request: Request & { user: Customer },
  ): Promise<Sale> {
    return this.saleService.createForCustomer(
      createDto,
      request.user.identificacion,
    );
  }

  @Get()
  findAll(
    @Req() request: Request & { user: Customer },
    @Query() query: PaginationDto,
  ) {
    return this.saleService.findAllForCustomer(
      request.user.identificacion,
      query.page,
      query.limit,
    );
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user: Customer },
  ): Promise<Sale> {
    return this.saleService.findOneForCustomer(
      id,
      request.user.identificacion,
    );
  }

  @Get(':id/invoice')
  findInvoice(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user: Customer },
  ): Promise<Invoice> {
    return this.saleService.findInvoiceForCustomer(
      id,
      request.user.identificacion,
    );
  }
}
