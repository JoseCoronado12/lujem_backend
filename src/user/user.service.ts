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
import { createHash, randomBytes } from 'node:crypto';

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
  async findAll(page = 1, limit = 20, search?: string): Promise<{ items: User[]; total: number; page: number; limit: number; pages: number }> {
    const qb = this.userRepository
      .createQueryBuilder('usuario')
      .leftJoinAndSelect('usuario.role', 'rol')
      .where('usuario.activo = :active', { active: true });
    if (search) {
      qb.andWhere(
        '(usuario.nombres LIKE :search OR usuario.apellidos LIKE :search OR usuario.email LIKE :search OR usuario.identificacion LIKE :search)',
        { search: `%${search}%` },
      );
    }
    const [items, total] = await qb
      .orderBy('usuario.apellidos', 'ASC')
      .addOrderBy('usuario.nombres', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
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
        activo: true,
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
    user.activo = false;
    user.isActive = false;
    await this.userRepository.save(user);
  }

  async requestPasswordReset(email: string): Promise<string | null> {
    const user = await this.userRepository.findOne({
      where: { email, activo: true },
      select: { id: true, email: true, resetTokenHash: true, resetTokenExpires: true, activo: true },
    });
    if (!user) return null;
    const token = randomBytes(32).toString('hex');
    user.resetTokenHash = createHash('sha256').update(token).digest('hex');
    user.resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000);
    await this.userRepository.save(user);
    return token;
  }

  async resetPassword(
    email: string,
    token: string,
    password: string,
  ): Promise<void> {
    const hash = createHash('sha256').update(token).digest('hex');
    const user = await this.userRepository.findOne({
      where: { email, activo: true },
      select: {
        id: true,
        email: true,
        password: true,
        resetTokenHash: true,
        resetTokenExpires: true,
        activo: true,
      },
    });
    if (
      !user ||
      user.resetTokenHash !== hash ||
      !user.resetTokenExpires ||
      user.resetTokenExpires.getTime() < Date.now()
    ) {
      throw new ConflictException('Token de recuperación inválido o expirado');
    }
    user.password = await bcrypt.hash(password, this.saltRounds);
    user.resetTokenHash = null;
    user.resetTokenExpires = null;
    await this.userRepository.save(user);
  }

  async issueRefreshToken(user: User): Promise<string> {
    const token = randomBytes(48).toString('hex');
    user.refreshTokenHash = createHash('sha256').update(token).digest('hex');
    await this.userRepository.save(user);
    return token;
  }

  async refreshStaff(refreshToken: string): Promise<User> {
    const hash = createHash('sha256').update(refreshToken).digest('hex');
    const user = await this.userRepository.findOne({
      where: { refreshTokenHash: hash, activo: true },
      relations: { role: true },
      select: {
        id: true,
        email: true,
        nombres: true,
        apellidos: true,
        isActive: true,
        activo: true,
        refreshTokenHash: true,
        role: { id: true, nombre: true },
      },
    });
    if (!user || !user.isActive) {
      throw new NotFoundException('Refresh token inválido');
    }
    return user;
  }
}
