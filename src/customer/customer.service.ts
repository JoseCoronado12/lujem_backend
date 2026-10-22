import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Sale } from '../sale/entities/sale.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer } from './entities/customer.entity';

@Injectable()
export class CustomerService {
  private readonly saltRounds = 10;

  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
  ) {}

  async create(createDto: CreateCustomerDto): Promise<Customer> {
    const duplicate = await this.customerRepository.exists({
      where: [
        { identificacion: createDto.identificacion },
        { correo: createDto.correo },
      ],
    });
    if (duplicate) {
      throw new ConflictException(
        'La identificación o el correo ya están registrados',
      );
    }

    const { contrasena, ...customerData } = createDto;
    const customer = this.customerRepository.create({
      ...customerData,
      contrasenaHash: contrasena
        ? await bcrypt.hash(contrasena, this.saltRounds)
        : null,
    });

    return await this.customerRepository.save(customer);
  }

  async findAll(): Promise<Customer[]> {
    return await this.customerRepository.find({
      order: { apellidos: 'ASC', nombres: 'ASC' },
    });
  }

  async findOne(identificacion: string): Promise<Customer> {
    const customer = await this.customerRepository.findOneBy({ identificacion });
    if (!customer) {
      throw new NotFoundException(
        `Cliente ${identificacion} no encontrado`,
      );
    }
    return customer;
  }

  async update(
    identificacion: string,
    updateDto: UpdateCustomerDto,
  ): Promise<Customer> {
    const customer = await this.findOne(identificacion);
    if (
      updateDto.correo &&
      updateDto.correo !== customer.correo &&
      (await this.customerRepository.existsBy({ correo: updateDto.correo }))
    ) {
      throw new ConflictException('El correo ya está registrado');
    }

    const { contrasena, ...customerChanges } = updateDto;
    this.customerRepository.merge(customer, customerChanges);
    if (contrasena) {
      customer.contrasenaHash = await bcrypt.hash(
        contrasena,
        this.saltRounds,
      );
    }

    return await this.customerRepository.save(customer);
  }

  async remove(identificacion: string): Promise<void> {
    const saleExists = await this.saleRepository.exists({
      where: { cliente: { identificacion } },
    });
    if (saleExists) {
      throw new ConflictException(
        'No se puede eliminar un cliente que tiene ventas registradas',
      );
    }

    const result = await this.customerRepository.delete({ identificacion });
    if (!result.affected) {
      throw new NotFoundException(
        `Cliente ${identificacion} no encontrado`,
      );
    }
  }
}
