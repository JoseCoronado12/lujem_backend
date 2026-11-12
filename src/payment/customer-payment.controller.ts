import {
  BadRequestException,
  Body,
  Controller,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request } from 'express';
import { Customer } from '../customer/entities/customer.entity';
import { CreateOnlinePaymentDto } from './dto/create-online-payment.dto';
import { TransferReceiptDto } from './dto/transfer-receipt.dto';
import { Payment } from './entities/payment.entity';
import { PaymentMethod } from './entities/payment-method.entity';
import { BankAccount } from './entities/bank-account.entity';
import { PaymentService } from './payment.service';

const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

@Controller('customer/payments')
@UseGuards(AuthGuard('customer-jwt'))
export class CustomerPaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('methods')
  findMethods(): Promise<PaymentMethod[]> {
    return this.paymentService.findMethods();
  }

  @Get('bank-accounts')
  findBankAccounts(): Promise<BankAccount[]> {
    return this.paymentService.findBankAccounts();
  }

  @Get('sales/:saleId')
  findAll(
    @Param('saleId', ParseIntPipe) saleId: number,
    @Req() request: Request & { user: Customer },
  ): Promise<Payment[]> {
    return this.paymentService.findAllForCustomer(
      saleId,
      request.user.identificacion,
    );
  }

  @Post('sales/:saleId')
  createOnlinePayment(
    @Param('saleId', ParseIntPipe) saleId: number,
    @Body() createDto: CreateOnlinePaymentDto,
    @Req() request: Request & { user: Customer },
  ): Promise<Payment> {
    return this.paymentService.createCustomerTransfer(
      saleId,
      createDto,
      request.user.identificacion,
    );
  }

  @Get('sales/:saleId/:paymentId')
  findOne(
    @Param('saleId', ParseIntPipe) saleId: number,
    @Param('paymentId', ParseIntPipe) paymentId: number,
    @Req() request: Request & { user: Customer },
  ): Promise<Payment> {
    return this.paymentService.findForCustomer(
      saleId,
      paymentId,
      request.user.identificacion,
    );
  }

  @Post('sales/:saleId/:paymentId/receipts')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_RECEIPT_BYTES, files: 1 },
      fileFilter: (_request, file, callback) => {
        if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
          callback(
            new BadRequestException(
              'Solo se permiten JPEG, PNG, WEBP o PDF',
            ),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  async uploadReceipt(
    @Param('saleId', ParseIntPipe) saleId: number,
    @Param('paymentId', ParseIntPipe) paymentId: number,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_RECEIPT_BYTES }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() receiptDto: TransferReceiptDto,
    @Req() request: Request & { user: Customer },
  ): Promise<{ id: number; nombreArchivo: string; tipoMime: string }> {
    const customerId = request.user.identificacion;
    await this.paymentService.findForCustomer(saleId, paymentId, customerId);
    return await this.paymentService.uploadReceipt(
      paymentId,
      file,
      receiptDto,
      customerId,
    );
  }

  @Get('sales/:saleId/:paymentId/receipts/:receiptId/url')
  async getReceiptDownloadUrl(
    @Param('saleId', ParseIntPipe) saleId: number,
    @Param('paymentId', ParseIntPipe) paymentId: number,
    @Param('receiptId', ParseIntPipe) receiptId: number,
    @Req() request: Request & { user: Customer },
  ): Promise<{ url: string; expiresInSeconds: null }> {
    await this.paymentService.findForCustomer(
      saleId,
      paymentId,
      request.user.identificacion,
    );
    return await this.paymentService.getReceiptDownloadUrl(
      paymentId,
      receiptId,
      request.user.identificacion,
    );
  }
}
