import {
  Body,
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseIntPipe,
  ParseFilePipe,
  Post,
  Patch,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request } from 'express';
import type { User } from '../user/entities/user.entity';
import { Roles } from '../user/decorators/roles.decorator';
import { RolesGuard } from '../user/guards/roles.guard';
import { CreateBankAccountDto } from './dto/create-payment-method-account.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { TransferReceiptDto } from './dto/transfer-receipt.dto';
import { ValidatePaymentDto } from './dto/validate-payment.dto';
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

@Controller('payments')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('methods')
  findMethods(): Promise<PaymentMethod[]> {
    return this.paymentService.findMethods();
  }

  @Get('bank-accounts')
  findBankAccounts(): Promise<BankAccount[]> {
    return this.paymentService.findBankAccounts();
  }

  @Post('bank-accounts')
  createBankAccount(
    @Body() createDto: CreateBankAccountDto,
  ): Promise<BankAccount> {
    return this.paymentService.createBankAccount(createDto);
  }

  @Patch('bank-accounts/:id/deactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  deactivateBankAccount(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.paymentService.deactivateBankAccount(id);
  }

  @Post()
  createPayment(
    @Body() createDto: CreatePaymentDto,
    @Req() request: Request & { user: User },
  ): Promise<Payment> {
    return this.paymentService.createPayment(createDto, request.user.id);
  }

  @Post(':id/receipts')
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
  uploadReceipt(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_RECEIPT_BYTES }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() receiptDto: TransferReceiptDto,
  ): Promise<{ id: number; nombreArchivo: string; tipoMime: string }> {
    return this.paymentService.uploadReceipt(
      id,
      file,
      receiptDto,
    );
  }

  @Patch(':id/validation')
  validatePayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() validationDto: ValidatePaymentDto,
    @Req() request: Request & { user: User },
  ): Promise<Payment> {
    return this.paymentService.validatePayment(
      id,
      request.user.id,
      validationDto,
    );
  }

  @Get(':id/receipts/:receiptId/url')
  getReceiptDownloadUrl(
    @Param('id', ParseIntPipe) id: number,
    @Param('receiptId', ParseIntPipe) receiptId: number,
  ): Promise<{ url: string; expiresInSeconds: null }> {
    return this.paymentService.getReceiptDownloadUrl(id, receiptId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Payment> {
    return this.paymentService.findOne(id);
  }
}
