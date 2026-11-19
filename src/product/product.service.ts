import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { ProductLot } from './entities/product-lot.entity';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { User } from '../user/entities/user.entity';
import { PublicCatalogQueryDto } from './dto/public-catalog-query.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductLot)
    private readonly lotRepository: Repository<ProductLot>,
    @InjectRepository(InventoryMovement)
    private readonly movementRepository: Repository<InventoryMovement>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    if (
      await this.productRepository.existsBy({
        codigoBarras: createProductDto.codigoBarras,
      })
    ) {
      throw new ConflictException('El código de barras ya está registrado');
    }

    return await this.productRepository.save(
      this.productRepository.create(createProductDto),
    );
  }

  async findAll(): Promise<Product[]> {
    return await this.productRepository.find({
      where: { activo: true },
      order: { nombreProducto: 'ASC' },
    });
  }

  async findPaginated(page = 1, limit = 20, search?: string) {
    const qb = this.productRepository
      .createQueryBuilder('producto')
      .where('producto.activo = :active', { active: true });
    if (search) {
      qb.andWhere(
        '(producto.nombreProducto LIKE :search OR producto.codigoBarras LIKE :search)',
        { search: `%${search}%` },
      );
    }
    const [items, total] = await qb
      .orderBy('producto.nombreProducto', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findPublicCatalog(query: PublicCatalogQueryDto) {
    const qb = this.productRepository
      .createQueryBuilder('producto')
      .select([
        'producto.codigoBarras',
        'producto.nombreProducto',
        'producto.laboratorio',
        'producto.presentacion',
        'producto.registroInvima',
        'producto.requiereFormula',
        'producto.valorUnitario',
        'producto.categoria',
        'producto.principioActivo',
      ]);
    if (query.search) {
      qb.andWhere(
        '(producto.nombreProducto LIKE :search OR producto.laboratorio LIKE :search OR producto.presentacion LIKE :search)',
        { search: `%${query.search}%` },
      );
    }
    if (query.laboratorio) {
      qb.andWhere('producto.laboratorio LIKE :laboratorio', {
        laboratorio: `%${query.laboratorio}%`,
      });
    }
    if (query.categoria) {
      qb.andWhere('producto.categoria LIKE :categoria', {
        categoria: `%${query.categoria}%`,
      });
    }
    if (query.principioActivo) {
      qb.andWhere('producto.principioActivo LIKE :principioActivo', {
        principioActivo: `%${query.principioActivo}%`,
      });
    }
    if (query.onlyAvailable) {
      qb.andWhere('producto.stock - producto.stockReservado > 0');
      qb.andWhere(
        'NOT EXISTS (SELECT 1 FROM lotes_producto lote WHERE lote.codigo_barras = producto.codigo_barras AND lote.activo = 1 AND lote.fecha_vencimiento <= CURRENT_DATE())',
      );
    }
    return await qb.orderBy('producto.nombreProducto', 'ASC').getMany();
  }

  async findOne(codigoBarras: string): Promise<Product> {
    const product: Product | null = await this.productRepository.findOneBy({
      codigoBarras,
    });
    if (!product) {
      throw new NotFoundException(
        `Producto con código ${codigoBarras} no encontrado`,
      );
    }

    return product;
  }

  async update(
    codigoBarras: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findOne(codigoBarras);
    this.productRepository.merge(product, updateProductDto);
    return await this.productRepository.save(product);
  }

  async findLowStock(): Promise<Product[]> {
    return await this.productRepository
      .createQueryBuilder('producto')
      .where('producto.stock - producto.stockReservado <= producto.stockMinimo')
      .orderBy('producto.stock', 'ASC')
      .getMany();
  }

  async findExpiring(days: number): Promise<ProductLot[]> {
    const today = new Date();
    const limit = new Date(today);
    limit.setUTCDate(limit.getUTCDate() + days);
    return await this.lotRepository.find({
      where: {
        activo: true,
      },
      relations: { producto: true },
      order: { fechaVencimiento: 'ASC' },
    }).then((lots) =>
      lots.filter((lot) => {
        const expiry = new Date(`${lot.fechaVencimiento}T00:00:00Z`);
        return expiry >= today && expiry <= limit && lot.cantidad > 0;
      }),
    );
  }

  async adjustStock(
    codigoBarras: string,
    dto: AdjustStockDto,
    userId: number,
  ): Promise<Product> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const product = await queryRunner.manager.findOne(Product, {
        where: { codigoBarras },
        lock: { mode: 'pessimistic_write' },
      });
      if (!product) {
        throw new NotFoundException(`Producto ${codigoBarras} no encontrado`);
      }
      const user = await queryRunner.manager.findOneBy(User, { id: userId });
      if (!user) throw new NotFoundException(`Usuario ${userId} no encontrado`);

      const previous = product.stock;
      let next = previous;
      if (dto.tipo === 'ENTRADA' || dto.tipo === 'DEVOLUCION') {
        next += dto.cantidad;
      } else if (dto.tipo === 'SALIDA' || dto.tipo === 'MERMA') {
        next -= dto.cantidad;
      } else {
        next = dto.cantidad;
      }
      if (next < 0) throw new BadRequestException('El ajuste deja stock negativo');

      product.stock = next;
      await queryRunner.manager.save(product);
      await queryRunner.manager.save(
        queryRunner.manager.create(InventoryMovement, {
          producto: product,
          usuario: user,
          tipo: dto.tipo,
          cantidad: dto.cantidad,
          stockAnterior: previous,
          stockNuevo: next,
          motivo: dto.motivo,
          referencia: dto.referencia ?? null,
        }),
      );
      await queryRunner.commitTransaction();
      return await this.findOne(codigoBarras);
    } catch (error) {
      if (queryRunner.isTransactionActive) await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findMovements(codigoBarras?: string): Promise<InventoryMovement[]> {
    const where = codigoBarras
      ? { producto: { codigoBarras } }
      : undefined;
    return await this.movementRepository.find({
      where,
      relations: { producto: true, usuario: true },
      order: { fecha: 'DESC', id: 'DESC' },
    });
  }

  async remove(codigoBarras: string): Promise<void> {
    const product = await this.findOne(codigoBarras);
    product.activo = false;
    await this.productRepository.save(product);
  }
}
