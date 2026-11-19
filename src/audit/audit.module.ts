import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Audit } from './audit.entity';
import { AuditService } from './audit.service';

@Module({
  imports: [TypeOrmModule.forFeature([Audit])],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
