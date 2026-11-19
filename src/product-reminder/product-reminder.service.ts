import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../customer/entities/customer.entity';
import { Product } from '../product/entities/product.entity';
import { CreateProductReminderDto } from './dto/create-product-reminder.dto';
import { UpdateProductReminderDto } from './dto/update-product-reminder.dto';
import { ProductReminder } from './entities/product-reminder.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Logger } from '@nestjs/common';

@Injectable()
export class ProductReminderService {
  private readonly logger = new Logger(ProductReminderService.name);
  constructor(
    @InjectRepository(ProductReminder)
    private readonly reminderRepository: Repository<ProductReminder>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(dto: CreateProductReminderDto): Promise<ProductReminder> {
    const cliente = await this.customerRepository.findOneBy({
      identificacion: dto.identificacionCliente,
    });
    if (!cliente) {
      throw new NotFoundException(
        `Cliente ${dto.identificacionCliente} no encontrado`,
      );
    }

    const producto = await this.productRepository.findOneBy({
      codigoBarras: dto.codigoBarras,
    });
    if (!producto) {
      throw new NotFoundException(
        `Producto ${dto.codigoBarras} no encontrado`,
      );
    }

    return await this.reminderRepository.save(
      this.reminderRepository.create({
        cliente,
        producto,
        fechaRecordatorio: dto.fechaRecordatorio,
        frecuenciaDias: dto.frecuenciaDias,
        mensaje: dto.mensaje,
        activo: dto.activo ?? true,
      }),
    );
  }

  async findAll(): Promise<ProductReminder[]> {
    return await this.reminderRepository.find({
      relations: { cliente: true, producto: true },
      order: { fechaRecordatorio: 'ASC', id: 'ASC' },
    });
  }

  async findForCustomer(customerId: string): Promise<ProductReminder[]> {
    return await this.reminderRepository.find({
      where: { cliente: { identificacion: customerId } },
      relations: { cliente: true, producto: true },
      order: { fechaRecordatorio: 'ASC', id: 'ASC' },
    });
  }

  async updateForCustomer(
    id: number,
    customerId: string,
    dto: UpdateProductReminderDto,
  ): Promise<ProductReminder> {
    const reminder = await this.findOne(id);
    if (reminder.cliente.identificacion !== customerId) {
      throw new NotFoundException(`Recordatorio ${id} no encontrado`);
    }
    return await this.update(id, dto);
  }

  async removeForCustomer(id: number, customerId: string): Promise<void> {
    const reminder = await this.findOne(id);
    if (reminder.cliente.identificacion !== customerId) {
      throw new NotFoundException(`Recordatorio ${id} no encontrado`);
    }
    await this.remove(id);
  }

  async findDue(): Promise<ProductReminder[]> {
    return await this.reminderRepository
      .createQueryBuilder('recordatorio')
      .leftJoinAndSelect('recordatorio.cliente', 'cliente')
      .leftJoinAndSelect('recordatorio.producto', 'producto')
      .where('recordatorio.activo = :activo', { activo: true })
      .andWhere('recordatorio.fechaRecordatorio <= CURRENT_DATE()')
      .orderBy('recordatorio.fechaRecordatorio', 'ASC')
      .addOrderBy('recordatorio.id', 'ASC')
      .getMany();
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async processDueReminders(): Promise<void> {
    const due = await this.findDue();
    const webhook = process.env.NOTIFICATION_WEBHOOK_URL;
    for (const reminder of due) {
      const payload = {
        customerId: reminder.cliente.identificacion,
        customerEmail: reminder.cliente.correo,
        product: reminder.producto.nombreProducto,
        message: reminder.mensaje,
        reminderId: reminder.id,
      };
      if (webhook) {
        try {
          await fetch(webhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        } catch (error) {
          this.logger.error(`No se pudo enviar recordatorio ${reminder.id}`, error);
          continue;
        }
      } else {
        this.logger.log(`Recordatorio pendiente ${JSON.stringify(payload)}`);
      }

      const next = new Date(`${reminder.fechaRecordatorio}T12:00:00`);
      next.setDate(next.getDate() + reminder.frecuenciaDias);
      reminder.fechaRecordatorio = next.toISOString().slice(0, 10);
      await this.reminderRepository.save(reminder);
    }
  }

  async findOne(id: number): Promise<ProductReminder> {
    const reminder = await this.reminderRepository.findOne({
      where: { id },
      relations: { cliente: true, producto: true },
    });
    if (!reminder) {
      throw new NotFoundException(`Recordatorio ${id} no encontrado`);
    }
    return reminder;
  }

  async update(
    id: number,
    dto: UpdateProductReminderDto,
  ): Promise<ProductReminder> {
    const reminder = await this.findOne(id);

    if (dto.identificacionCliente !== undefined) {
      const customer = await this.customerRepository.findOneBy({
        identificacion: dto.identificacionCliente,
      });
      if (!customer) {
        throw new NotFoundException(
          `Cliente ${dto.identificacionCliente} no encontrado`,
        );
      }
      reminder.cliente = customer;
    }

    if (dto.codigoBarras !== undefined) {
      const product = await this.productRepository.findOneBy({
        codigoBarras: dto.codigoBarras,
      });
      if (!product) {
        throw new NotFoundException(
          `Producto ${dto.codigoBarras} no encontrado`,
        );
      }
      reminder.producto = product;
    }

    if (dto.fechaRecordatorio !== undefined) {
      reminder.fechaRecordatorio = dto.fechaRecordatorio;
    }
    if (dto.frecuenciaDias !== undefined) {
      reminder.frecuenciaDias = dto.frecuenciaDias;
    }
    if (dto.mensaje !== undefined) {
      reminder.mensaje = dto.mensaje;
    }
    if (dto.activo !== undefined) {
      reminder.activo = dto.activo;
    }

    return await this.reminderRepository.save(reminder);
  }

  async remove(id: number): Promise<void> {
    const result = await this.reminderRepository.delete({ id });
    if (!result.affected) {
      throw new NotFoundException(`Recordatorio ${id} no encontrado`);
    }
  }
}
