import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
  Post,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../user/decorators/roles.decorator';
import { RolesGuard } from '../user/guards/roles.guard';
import { Invoice } from './entities/invoice.entity';
import { InvoiceService } from './invoice.service';
import { ElectronicInvoiceService } from './electronic-invoice.service';

@Controller('invoices')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'REGENTE')
export class InvoiceController {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly electronicInvoiceService: ElectronicInvoiceService,
  ) {}

  @Get()
  findAll(): Promise<Invoice[]> {
    return this.invoiceService.findAll();
  }

  @Get('sales/:saleId')
  findBySale(
    @Param('saleId', ParseIntPipe) saleId: number,
  ): Promise<Invoice> {
    return this.invoiceService.findBySale(saleId);
  }

  @Post(':id/electronic-submit')
  submitElectronic(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Invoice> {
    return this.electronicInvoiceService.submit(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Invoice> {
    return this.invoiceService.findOne(id);
  }
}
