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

@Injectable()
export class ProductReminderService {
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
