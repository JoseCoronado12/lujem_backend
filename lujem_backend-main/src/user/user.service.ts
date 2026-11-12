import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  // Número de rondas de encriptación de bcrypt
  private readonly saltRounds = 10;

  constructor(
    // Inyección del repositorio de User
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  /**
   * Crear un nuevo usuario
   * Encripta la contraseña antes de guardarla
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    // Verificar si el email ya existe
    const emailTaken: boolean = await this.userRepository.existsBy({
      email: createUserDto.email,
    });

    if (emailTaken) {
      throw new ConflictException('El email ya está registrado');
    }

    // Encriptar la contraseña
    const hashedPassword: string = await bcrypt.hash(
      createUserDto.password,
      this.saltRounds,
    );

    const role: Role | null = await this.roleRepository.findOneBy({
      nombre: 'USER',
    });
    if (!role) {
      throw new NotFoundException('El rol USER no está configurado');
    }

    const user: User = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role,
    });

    // Guardar en la base de datos
    return await this.userRepository.save(user);
  }

  /**
   * Obtener todos los usuarios
   * No incluye las contraseñas (select: false en la entidad)
   */
  async findAll(): Promise<User[]> {
    return await this.userRepository.find({ relations: { role: true } });
  }

  /**
   * Obtener un usuario por ID
   * Lanza 404 si no existe (para uso en controladores)
   */
  async findOne(id: number): Promise<User> {
    const user: User | null = await this.userRepository.findOne({
      where: { id },
      relations: { role: true },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return user;
  }

  /**
   * Buscar un usuario por ID sin lanzar excepción
   * Devuelve null si no existe (lo usa la estrategia JWT)
   */
  async findById(id: number): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id },
      relations: { role: true },
    });
  }

  /**
   * Buscar usuario por email
   * Incluye la contraseña (solo para autenticación)
   * Devuelve null si el email no está registrado
   */
  async findOneByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        nombres: true,
        apellidos: true,
        role: { id: true, nombre: true },
        isActive: true,
      },
      relations: { role: true },
    });
  }

  /**
   * Actualizar un usuario
   */
  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user: User = await this.findOne(id);

    // Si se cambia el email, verificar que no pertenezca a otro usuario
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const emailTaken: boolean = await this.userRepository.existsBy({
        email: updateUserDto.email,
      });
      if (emailTaken) {
        throw new ConflictException('El email ya está registrado');
      }
    }

    // Copia de los cambios para no modificar el DTO recibido
    const { role: roleName, ...changes } = updateUserDto;

    // Si se actualiza la contraseña, encriptarla
    if (changes.password) {
      changes.password = await bcrypt.hash(changes.password, this.saltRounds);
    }

    if (roleName) {
      const role: Role | null = await this.roleRepository.findOneBy({
        nombre: roleName,
      });
      if (!role) {
        throw new NotFoundException(`Rol ${roleName} no encontrado`);
      }
      user.role = role;
    }

    this.userRepository.merge(user, changes);

    return await this.userRepository.save(user);
  }

  /**
   * Eliminar un usuario (borrado físico del registro)
   */
  async remove(id: number): Promise<void> {
    const user: User = await this.findOne(id);
    await this.userRepository.remove(user);
  }
}
