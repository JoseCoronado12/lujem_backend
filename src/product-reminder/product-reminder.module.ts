import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '../customer/entities/customer.entity';
import { Product } from '../product/entities/product.entity';
import { RolesGuard } from '../user/guards/roles.guard';
import { ProductReminder } from './entities/product-reminder.entity';
import {
  CustomerProductReminderController,
  ProductReminderController,
} from './product-reminder.controller';
import { ProductReminderService } from './product-reminder.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProductReminder, Customer, Product])],
  controllers: [
    ProductReminderController,
    CustomerProductReminderController,
  ],
  providers: [ProductReminderService, RolesGuard],
})
export class ProductReminderModule {}
