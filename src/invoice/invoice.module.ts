import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaleModule } from '../sale/sale.module';
import { RolesGuard } from '../user/guards/roles.guard';
import { Invoice } from './entities/invoice.entity';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';
import { ElectronicInvoiceService } from './electronic-invoice.service';

@Module({
  imports: [SaleModule, TypeOrmModule.forFeature([Invoice])],
  controllers: [InvoiceController],
  providers: [InvoiceService, ElectronicInvoiceService, RolesGuard],
})
export class InvoiceModule {}
