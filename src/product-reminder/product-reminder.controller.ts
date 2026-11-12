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
import { CreateProductReminderDto } from './dto/create-product-reminder.dto';
import { UpdateProductReminderDto } from './dto/update-product-reminder.dto';
import { ProductReminder } from './entities/product-reminder.entity';
import { ProductReminderService } from './product-reminder.service';

@Controller('product-reminders')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
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
