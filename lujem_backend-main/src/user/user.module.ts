import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { RolesGuard } from './guards/roles.guard';

@Module({
  // Importar el repositorio de User
  imports: [TypeOrmModule.forFeature([User, Role])],
  controllers: [UserController],
  providers: [UserService, RolesGuard],
  // Exportar el servicio para usarlo en otros módulos (como Auth)
  exports: [UserService],
})
export class UserModule {}
