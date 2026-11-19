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
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../user/decorators/roles.decorator';
import { RolesGuard } from '../user/guards/roles.guard';
import { CreateProductReminderDto } from './dto/create-product-reminder.dto';
import { UpdateProductReminderDto } from './dto/update-product-reminder.dto';
import { ProductReminder } from './entities/product-reminder.entity';
import { ProductReminderService } from './product-reminder.service';
import type { Request } from 'express';
import type { Customer } from '../customer/entities/customer.entity';

@Controller('product-reminders')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'REGENTE')
export class ProductReminderController {
  constructor(private readonly reminderService: ProductReminderService) {}

  @Post()
  create(
    @Body() createDto: CreateProductReminderDto,
  ): Promise<ProductReminder> {
    return this.reminderService.create(createDto);
  }

  @Get('due')
  findDue(): Promise<ProductReminder[]> {
    return this.reminderService.findDue();
  }

  @Get()
  findAll(): Promise<ProductReminder[]> {
    return this.reminderService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ProductReminder> {
    return this.reminderService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateProductReminderDto,
  ): Promise<ProductReminder> {
    return this.reminderService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.reminderService.remove(id);
  }
}

@Controller('customer/reminders')
@UseGuards(AuthGuard('customer-jwt'))
export class CustomerProductReminderController {
  constructor(private readonly reminderService: ProductReminderService) {}

  @Get()
  findAll(@Req() req: Request & { user: Customer }) {
    return this.reminderService.findForCustomer(req.user.identificacion);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductReminderDto,
    @Req() req: Request & { user: Customer },
  ) {
    return this.reminderService.updateForCustomer(
      id,
      req.user.identificacion,
      dto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: Customer },
  ) {
    return this.reminderService.removeForCustomer(
      id,
      req.user.identificacion,
    );
  }
}
