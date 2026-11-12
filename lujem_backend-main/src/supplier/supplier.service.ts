import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { Supplier } from './entities/supplier.entity';

@Injectable()
export class SupplierService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
  ) {}

  async create(createSupplierDto: CreateSupplierDto): Promise<Supplier> {
    if (await this.supplierRepository.existsBy({ nit: createSupplierDto.nit })) {
      throw new ConflictException('El NIT ya está registrado');
    }

    return await this.supplierRepository.save(
      this.supplierRepository.create(createSupplierDto),
    );
  }

  async findAll(): Promise<Supplier[]> {
    return await this.supplierRepository.find({ order: { nombre: 'ASC' } });
  }

  async findOne(codigoProveedor: number): Promise<Supplier> {
    const supplier: Supplier | null =
      await this.supplierRepository.findOneBy({ codigoProveedor });
    if (!supplier) {
      throw new NotFoundException(
        `Proveedor ${codigoProveedor} no encontrado`,
      );
    }

    return supplier;
  }

  async update(
    codigoProveedor: number,
    updateSupplierDto: UpdateSupplierDto,
  ): Promise<Supplier> {
    const supplier = await this.findOne(codigoProveedor);
    if (
      updateSupplierDto.nit &&
      updateSupplierDto.nit !== supplier.nit &&
      (await this.supplierRepository.existsBy({ nit: updateSupplierDto.nit }))
    ) {
      throw new ConflictException('El NIT ya está registrado');
    }

    this.supplierRepository.merge(supplier, updateSupplierDto);
    return await this.supplierRepository.save(supplier);
  }

  async remove(codigoProveedor: number): Promise<void> {
    const result = await this.supplierRepository.delete({ codigoProveedor });
    if (!result.affected) {
      throw new NotFoundException(
        `Proveedor ${codigoProveedor} no encontrado`,
      );
    }
  }
}
