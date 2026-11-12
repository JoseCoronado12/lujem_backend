import { PartialType } from '@nestjs/mapped-types';
import { CreateProductReminderDto } from './create-product-reminder.dto';

export class UpdateProductReminderDto extends PartialType(
  CreateProductReminderDto,
) {}
