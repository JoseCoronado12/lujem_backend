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

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
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
      order: { nombreProducto: 'ASC' },
    });
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

  async remove(codigoBarras: string): Promise<void> {
    const result = await this.productRepository.delete({ codigoBarras });
    if (!result.affected) {
      throw new NotFoundException(
        `Producto con código ${codigoBarras} no encontrado`,
      );
    }
  }
}
