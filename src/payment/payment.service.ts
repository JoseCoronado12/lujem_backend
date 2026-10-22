import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { basename } from 'node:path';
import {
  DataSource,
  EntityManager,
  Repository,
} from 'typeorm';
import { Sale } from '../sale/entities/sale.entity';
import { SaleStatus } from '../sale/entities/sale-status.enum';
import { SaleService } from '../sale/sale.service';
import { User } from '../user/entities/user.entity';
import { BankAccount } from './entities/bank-account.entity';
import { PaymentMethod } from './entities/payment-method.entity';
import { Payment } from './entities/payment.entity';
import { PaymentStatus } from './entities/payment-status.enum';
import { PaymentValidation } from './entities/payment-validation.entity';
import { TransferReceipt } from './entities/transfer-receipt.entity';
import { CloudinaryStorageService } from './cloudinary-storage.service';
import { CreateBankAccountDto } from './dto/create-payment-method-account.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { TransferReceiptDto } from './dto/transfer-receipt.dto';
import { ValidatePaymentDto } from './dto/validate-payment.dto';

const MAX_DECIMAL_CENTS = 9_999_999_999;
const MAX_FILE_BYTES = 5 * 1024 * 1024;

function cents(amount: number): number {
  return Math.round(amount * 100);
}

function money(amount: number): number {
  return Number((amount / 100).toFixed(2));
}

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(PaymentMethod)
    private readonly methodRepository: Repository<PaymentMethod>,
    @InjectRepository(BankAccount)
    private readonly bankAccountRepository: Repository<BankAccount>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(TransferReceipt)
    private readonly receiptRepository: Repository<TransferReceipt>,
    private readonly dataSource: DataSource,
    private readonly saleService: SaleService,
    private readonly cloudinaryStorage: CloudinaryStorageService,
  ) {}

  async findMethods(): Promise<PaymentMethod[]> {
    return await this.methodRepository.find({ order: { id: 'ASC' } });
  }

  async findBankAccounts(): Promise<BankAccount[]> {
    return await this.bankAccountRepository.find({
      where: { activa: true },
      order: { banco: 'ASC', id: 'ASC' },
    });
  }

  async createBankAccount(dto: CreateBankAccountDto): Promise<BankAccount> {
    return await this.bankAccountRepository.save(
      this.bankAccountRepository.create(dto),
    );
  }

  async deactivateBankAccount(id: number): Promise<void> {
    const account = await this.bankAccountRepository.findOneBy({ id });
    if (!account) {
      throw new NotFoundException(`Cuenta bancaria ${id} no encontrada`);
    }
    account.activa = false;
    await this.bankAccountRepository.save(account);
  }

  async createPayment(
    dto: CreatePaymentDto,
    userId: number,
  ): Promise<Payment> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const sale = await queryRunner.manager.findOne(Sale, {
        where: { id: dto.idVenta },
        lock: { mode: 'pessimistic_write' },
      });
      if (!sale) {
        throw new NotFoundException(`Venta ${dto.idVenta} no encontrada`);
      }
      if (
        sale.estado === SaleStatus.PAGADA ||
        sale.estado === SaleStatus.ENTREGADA ||
        sale.estado === SaleStatus.ANULADA
      ) {
        throw new BadRequestException(
          `No se puede registrar un pago para una venta ${sale.estado}`,
        );
      }

      const method = await queryRunner.manager.findOneBy(PaymentMethod, {
        id: dto.idMetodoPago,
      });
      if (!method) {
        throw new NotFoundException(
          `Método de pago ${dto.idMetodoPago} no encontrado`,
        );
      }

      const user = await queryRunner.manager.findOneBy(User, { id: userId });
      if (!user) {
        throw new NotFoundException(`Usuario ${userId} no encontrado`);
      }

      const approvedCents = await this.getApprovedTotalCents(
        queryRunner.manager,
        sale.id,
      );
      if (
        approvedCents + cents(dto.monto) > cents(sale.total) ||
        cents(dto.monto) > MAX_DECIMAL_CENTS
      ) {
        throw new BadRequestException(
          'El monto supera el saldo pendiente de la venta',
        );
      }

      let account: BankAccount | null = null;
      let status = PaymentStatus.PENDIENTE;
      let change: number | null = null;
      let received: number | null = null;
      const isCash = method.nombre === 'EFECTIVO';
      const isTransfer = method.nombre === 'TRANSFERENCIA';
      if (!isCash && !isTransfer) {
        throw new BadRequestException('Método de pago no soportado');
      }

      if (isCash) {
        if (dto.idCuentaDestino !== undefined) {
          throw new BadRequestException(
            'El efectivo no debe especificar una cuenta bancaria',
          );
        }
        if (
          dto.montoRecibido === undefined ||
          cents(dto.montoRecibido) < cents(dto.monto)
        ) {
          throw new BadRequestException(
            'El monto recibido debe ser igual o superior al pago',
          );
        }
        received = dto.montoRecibido;
        change = money(cents(received) - cents(dto.monto));
        status = PaymentStatus.APROBADO;
      } else {
        if (dto.montoRecibido !== undefined) {
          throw new BadRequestException(
            'Una transferencia no debe especificar efectivo recibido',
          );
        }
        if (dto.idCuentaDestino === undefined) {
          throw new BadRequestException(
            'La transferencia requiere una cuenta bancaria destino',
          );
        }
        account = await queryRunner.manager.findOneBy(BankAccount, {
          id: dto.idCuentaDestino,
          activa: true,
        });
        if (!account) {
          throw new NotFoundException(
            `Cuenta bancaria ${dto.idCuentaDestino} no encontrada o inactiva`,
          );
        }
      }

      const payment = queryRunner.manager.create(Payment, {
        venta: sale,
        metodo: method,
        cuentaDestino: account,
        monto: dto.monto,
        montoRecibido: received,
        cambio: change,
        estado: status,
        usuario: user,
        fechaAprobacion: isCash ? new Date() : null,
      });
      const savedPayment = await queryRunner.manager.save(payment);

      if (isCash) {
        await this.updateSalePaymentState(
          queryRunner.manager,
          sale,
          approvedCents + cents(dto.monto),
        );
      }

      await queryRunner.commitTransaction();
      return await this.findOne(savedPayment.id);
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async uploadReceipt(
    paymentId: number,
    file: Express.Multer.File,
    dto: TransferReceiptDto,
  ): Promise<{ id: number; nombreArchivo: string; tipoMime: string }> {
    if (!file?.buffer || file.size < 1 || file.size > MAX_FILE_BYTES) {
      throw new BadRequestException(
        'El comprobante debe medir entre 1 byte y 5 MB',
      );
    }

    const safeName = basename(file.originalname).replace(/[\r\n]/g, '').slice(0, 255);
    const queryRunner = this.dataSource.createQueryRunner();
    let uploadedPublicId: string | undefined;

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const lockedPayment = await queryRunner.manager.findOne(Payment, {
        where: { id: paymentId },
        relations: { venta: true, metodo: true },
        lock: { mode: 'pessimistic_write' },
      });
      if (!lockedPayment) {
        throw new NotFoundException(`Pago ${paymentId} no encontrado`);
      }
      if (
        lockedPayment.metodo.nombre !== 'TRANSFERENCIA' ||
        (lockedPayment.estado !== PaymentStatus.PENDIENTE &&
          lockedPayment.estado !== PaymentStatus.RECHAZADO)
      ) {
        throw new ConflictException(
          'El estado del pago cambió mientras se cargaba el archivo',
        );
      }

      const upload = await this.cloudinaryStorage.upload(
        file.buffer,
        file.mimetype,
      );
      uploadedPublicId = upload.publicId;
      const receipt = queryRunner.manager.create(TransferReceipt, {
        pago: lockedPayment,
        cloudinaryPublicId: upload.publicId,
        nombreArchivo: safeName,
        tipoMime: file.mimetype,
        tamanoBytes: upload.bytes,
        hashSha256: upload.sha256,
        bancoOrigen: dto.bancoOrigen,
        numeroReferencia: dto.numeroReferencia,
        fechaTransferencia: new Date(dto.fechaTransferencia),
      });
      const savedReceipt = await queryRunner.manager.save(receipt);
      lockedPayment.estado = PaymentStatus.EN_REVISION;
      await queryRunner.manager.save(lockedPayment);

      const sale = await queryRunner.manager.findOne(Sale, {
        where: { id: lockedPayment.venta.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!sale) {
        throw new NotFoundException(
          `Venta ${lockedPayment.venta.id} no encontrada`,
        );
      }
      sale.estado = SaleStatus.PAGO_EN_REVISION;
      await queryRunner.manager.save(sale);
      await queryRunner.commitTransaction();

      return {
        id: savedReceipt.id,
        nombreArchivo: savedReceipt.nombreArchivo,
        tipoMime: savedReceipt.tipoMime,
      };
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      if (uploadedPublicId) {
        try {
          await this.cloudinaryStorage.delete(uploadedPublicId, file.mimetype);
        } catch (cleanupError) {
          throw new ConflictException(
            'No se pudo registrar ni eliminar el archivo cargado en Cloudinary',
            { cause: cleanupError },
          );
        }
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async validatePayment(
    paymentId: number,
    userId: number,
    dto: ValidatePaymentDto,
  ): Promise<Payment> {
    if (
      dto.resultado === PaymentStatus.RECHAZADO &&
      !dto.motivoRechazo?.trim()
    ) {
      throw new BadRequestException(
        'El motivo de rechazo es obligatorio para rechazar un comprobante',
      );
    }
    if (
      dto.resultado === PaymentStatus.APROBADO &&
      dto.motivoRechazo !== undefined
    ) {
      throw new BadRequestException(
        'No se debe enviar un motivo de rechazo al aprobar',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const payment = await queryRunner.manager.findOne(Payment, {
        where: { id: paymentId },
        relations: { venta: true, metodo: true },
        lock: { mode: 'pessimistic_write' },
      });
      if (!payment) {
        throw new NotFoundException(`Pago ${paymentId} no encontrado`);
      }
      if (
        payment.metodo.nombre !== 'TRANSFERENCIA' ||
        payment.estado !== PaymentStatus.EN_REVISION
      ) {
        throw new BadRequestException(
          'Solo se pueden revisar pagos por transferencia en estado EN_REVISION',
        );
      }

      const receipt = await queryRunner.manager.findOne(TransferReceipt, {
        where: { id: dto.idComprobante, pago: { id: payment.id } },
      });
      if (!receipt) {
        throw new NotFoundException(
          `Comprobante ${dto.idComprobante} no pertenece al pago ${paymentId}`,
        );
      }
      const latestReceipt = await queryRunner.manager.findOne(
        TransferReceipt,
        {
          where: { pago: { id: payment.id } },
          order: { id: 'DESC' },
        },
      );
      if (latestReceipt?.id !== receipt.id) {
        throw new BadRequestException(
          'Solo se puede validar el comprobante más reciente del pago',
        );
      }
      if (
        await queryRunner.manager.exists(PaymentValidation, {
          where: { comprobante: { id: receipt.id } },
        })
      ) {
        throw new ConflictException(
          'El comprobante ya cuenta con una validación',
        );
      }

      const user = await queryRunner.manager.findOneBy(User, { id: userId });
      if (!user) {
        throw new NotFoundException(`Usuario ${userId} no encontrado`);
      }
      const sale = await queryRunner.manager.findOne(Sale, {
        where: { id: payment.venta.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!sale) {
        throw new NotFoundException(`Venta ${payment.venta.id} no encontrada`);
      }

      if (dto.resultado === PaymentStatus.APROBADO) {
        const approvedCents = await this.getApprovedTotalCents(
          queryRunner.manager,
          sale.id,
        );
        if (approvedCents + cents(payment.monto) > cents(sale.total)) {
          throw new BadRequestException(
            'El pago excedería el saldo pendiente de la venta',
          );
        }
        payment.estado = PaymentStatus.APROBADO;
        payment.fechaAprobacion = new Date();
        await queryRunner.manager.save(payment);
        await queryRunner.manager.save(
          queryRunner.manager.create(PaymentValidation, {
            comprobante: receipt,
            usuario: user,
            resultado: PaymentStatus.APROBADO,
            motivoRechazo: null,
          }),
        );
        await this.updateSalePaymentState(
          queryRunner.manager,
          sale,
          approvedCents + cents(payment.monto),
        );
      } else {
        payment.estado = PaymentStatus.RECHAZADO;
        payment.fechaAprobacion = null;
        await queryRunner.manager.save(payment);
        await queryRunner.manager.save(
          queryRunner.manager.create(PaymentValidation, {
            comprobante: receipt,
            usuario: user,
            resultado: PaymentStatus.RECHAZADO,
            motivoRechazo: dto.motivoRechazo!.trim(),
          }),
        );
        await this.refreshSaleReviewState(queryRunner.manager, sale);
      }

      await queryRunner.commitTransaction();
      return await this.findOne(payment.id);
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getReceiptDownloadUrl(
    paymentId: number,
    receiptId: number,
  ): Promise<{ url: string; expiresInSeconds: null }> {
    const receipt = await this.receiptRepository.findOne({
      where: { id: receiptId, pago: { id: paymentId } },
      relations: { pago: true },
    });
    if (!receipt) {
      throw new NotFoundException(
        `Comprobante ${receiptId} no pertenece al pago ${paymentId}`,
      );
    }
    return {
      url: this.cloudinaryStorage.getPublicDownloadUrl(
        receipt.cloudinaryPublicId,
        receipt.tipoMime,
      ),
      expiresInSeconds: null,
    };
  }

  async findOne(id: number): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: {
        venta: true,
        metodo: true,
        cuentaDestino: true,
        usuario: true,
        comprobantes: true,
      },
    });
    if (!payment) {
      throw new NotFoundException(`Pago ${id} no encontrado`);
    }
    return payment;
  }

  private async getApprovedTotalCents(
    manager: EntityManager,
    saleId: number,
  ): Promise<number> {
    const result = await manager
      .createQueryBuilder(Payment, 'payment')
      .select('COALESCE(SUM(payment.monto), 0)', 'total')
      .where('payment.venta = :saleId', { saleId })
      .andWhere('payment.estado = :status', {
        status: PaymentStatus.APROBADO,
      })
      .getRawOne<{ total: string }>();
    return cents(Number(result?.total ?? 0));
  }

  private async updateSalePaymentState(
    manager: EntityManager,
    sale: Sale,
    approvedCents: number,
  ): Promise<void> {
    if (approvedCents > cents(sale.total)) {
      throw new BadRequestException(
        'El total aprobado supera el total de la venta',
      );
    }
    if (approvedCents === cents(sale.total)) {
      await this.saleService.markPaidInTransaction(manager, sale);
      return;
    }

    await this.refreshSaleReviewState(manager, sale);
  }

  private async refreshSaleReviewState(
    manager: EntityManager,
    sale: Sale,
  ): Promise<void> {
    const hasReviewPayment = await manager
      .createQueryBuilder(Payment, 'payment')
      .where('payment.venta = :saleId', { saleId: sale.id })
      .andWhere('payment.estado = :status', {
        status: PaymentStatus.EN_REVISION,
      })
      .getExists();

    sale.estado = hasReviewPayment
      ? SaleStatus.PAGO_EN_REVISION
      : SaleStatus.PENDIENTE_PAGO;
    await manager.save(sale);
  }
}
