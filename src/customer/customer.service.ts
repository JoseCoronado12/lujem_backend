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
import { createHash, randomBytes } from 'node:crypto';

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
      where: { activo: true },
      order: { apellidos: 'ASC', nombres: 'ASC' },
    });
  }

  async findPaginated(page = 1, limit = 20, search?: string) {
    const qb = this.customerRepository
      .createQueryBuilder('cliente')
      .where('cliente.activo = :active', { active: true });
    if (search) {
      qb.andWhere(
        '(cliente.nombres LIKE :search OR cliente.apellidos LIKE :search OR cliente.identificacion LIKE :search)',
        { search: `%${search}%` },
      );
    }
    const [items, total] = await qb
      .orderBy('cliente.apellidos', 'ASC')
      .addOrderBy('cliente.nombres', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
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

  async findForAuthentication(correo: string): Promise<Customer | null> {
    return await this.customerRepository.findOne({
      where: { correo },
      select: {
        identificacion: true,
        tipoDocumento: true,
        nombres: true,
        apellidos: true,
        correo: true,
        telefono: true,
        direccion: true,
        contrasenaHash: true,
        activo: true,
      },
    });
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

  async requestPasswordReset(correo: string): Promise<string | null> {
    const customer = await this.customerRepository.findOne({
      where: { correo, activo: true },
    });
    if (!customer) return null;
    const token = randomBytes(32).toString('hex');
    customer.resetTokenHash = createHash('sha256').update(token).digest('hex');
    customer.resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000);
    await this.customerRepository.save(customer);
    return token;
  }

  async resetPassword(
    correo: string,
    token: string,
    password: string,
  ): Promise<void> {
    const hash = createHash('sha256').update(token).digest('hex');
    const customer = await this.customerRepository.findOne({
      where: { correo, activo: true },
      select: {
        identificacion: true,
        correo: true,
        contrasenaHash: true,
        resetTokenHash: true,
        resetTokenExpires: true,
        activo: true,
      },
    });
    if (
      !customer ||
      customer.resetTokenHash !== hash ||
      !customer.resetTokenExpires ||
      customer.resetTokenExpires.getTime() < Date.now()
    ) {
      throw new ConflictException('Token de recuperación inválido o expirado');
    }
    customer.contrasenaHash = await bcrypt.hash(password, this.saltRounds);
    customer.resetTokenHash = null;
    customer.resetTokenExpires = null;
    await this.customerRepository.save(customer);
  }

  async issueRefreshToken(customer: Customer): Promise<string> {
    const token = randomBytes(48).toString('hex');
    customer.refreshTokenHash = createHash('sha256').update(token).digest('hex');
    await this.customerRepository.save(customer);
    return token;
  }

  async refreshCustomer(refreshToken: string): Promise<Customer> {
    const hash = createHash('sha256').update(refreshToken).digest('hex');
    const customer = await this.customerRepository.findOne({
      where: { refreshTokenHash: hash, activo: true },
      select: {
        identificacion: true,
        correo: true,
        nombres: true,
        apellidos: true,
        activo: true,
        refreshTokenHash: true,
      },
    });
    if (!customer) {
      throw new NotFoundException('Refresh token inválido');
    }
    return customer;
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

    const customer = await this.findOne(identificacion);
    customer.activo = false;
    await this.customerRepository.save(customer);
  }
}
