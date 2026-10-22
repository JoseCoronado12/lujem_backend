import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaleModule } from '../sale/sale.module';
import { Sale } from '../sale/entities/sale.entity';
import { User } from '../user/entities/user.entity';
import { BankAccount } from './entities/bank-account.entity';
import { PaymentMethod } from './entities/payment-method.entity';
import { Payment } from './entities/payment.entity';
import { PaymentValidation } from './entities/payment-validation.entity';
import { TransferReceipt } from './entities/transfer-receipt.entity';
import { CloudinaryStorageService } from './cloudinary-storage.service';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { RolesGuard } from '../user/guards/roles.guard';

@Module({
  imports: [
    SaleModule,
    TypeOrmModule.forFeature([
      BankAccount,
      PaymentMethod,
      Payment,
      PaymentValidation,
      TransferReceipt,
      Sale,
      User,
    ]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, CloudinaryStorageService, RolesGuard],
  exports: [PaymentService],
})
export class PaymentModule {}
