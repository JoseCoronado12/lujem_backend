import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../user/guards/roles.guard';
import { SupplierController } from './supplier.controller';
import { Supplier } from './entities/supplier.entity';
import { SupplierService } from './supplier.service';

@Module({
  imports: [TypeOrmModule.forFeature([Supplier])],
  controllers: [SupplierController],
  providers: [SupplierService, RolesGuard],
  exports: [SupplierService],
})
export class SupplierModule {}
