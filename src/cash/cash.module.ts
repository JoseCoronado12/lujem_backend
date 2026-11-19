import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashRegisterSession } from './entities/cash-register-session.entity';
import { CashService } from './cash.service';
import { CashController } from './cash.controller';
import { Payment } from '../payment/entities/payment.entity';
import { RolesGuard } from '../user/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([CashRegisterSession, Payment])],
  controllers: [CashController],
  providers: [CashService, RolesGuard],
  exports: [CashService],
})
export class CashModule {}
