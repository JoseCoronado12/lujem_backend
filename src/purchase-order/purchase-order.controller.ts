import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import type { User } from '../user/entities/user.entity';
import { Roles } from '../user/decorators/roles.decorator';
import { RolesGuard } from '../user/guards/roles.guard';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderService } from './purchase-order.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RegisterPurchasePaymentDto } from './dto/register-purchase-payment.dto';

@Controller('purchase-orders')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'BODEGA')
export class PurchaseOrderController {
  constructor(private readonly purchaseOrderService: PurchaseOrderService) {}

  @Post()
  create(
    @Body() createDto: CreatePurchaseOrderDto,
    @Req() request: Request & { user: User },
  ): Promise<PurchaseOrder> {
    return this.purchaseOrderService.create(createDto, request.user.id);
  }

  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.purchaseOrderService.findAll(query.page, query.limit, query.search);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<PurchaseOrder> {
    return this.purchaseOrderService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePurchaseOrderDto,
  ): Promise<PurchaseOrder> {
    return this.purchaseOrderService.update(id, updateDto);
  }

  @Patch(':id/payment')
  registerPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RegisterPurchasePaymentDto,
  ): Promise<PurchaseOrder> {
    return this.purchaseOrderService.registerPayment(id, dto.monto);
  }
}
