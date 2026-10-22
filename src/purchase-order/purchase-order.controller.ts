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

@Controller('purchase-orders')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
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
  findAll(): Promise<PurchaseOrder[]> {
    return this.purchaseOrderService.findAll();
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
}
