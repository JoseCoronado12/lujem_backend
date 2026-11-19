import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Audit } from './audit.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(Audit)
    private readonly auditRepository: Repository<Audit>,
  ) {}

  async log(input: {
    actorTipo: 'STAFF' | 'CUSTOMER' | 'SYSTEM';
    actorId?: string | number;
    accion: string;
    entidad: string;
    entidadId?: string | number;
    datosAntes?: unknown;
    datosDespues?: unknown;
    ip?: string;
  }): Promise<Audit> {
    return await this.auditRepository.save(
      this.auditRepository.create({
        actorTipo: input.actorTipo,
        actorId: input.actorId?.toString() ?? null,
        accion: input.accion,
        entidad: input.entidad,
        entidadId: input.entidadId?.toString() ?? null,
        datosAntes: input.datosAntes
          ? JSON.stringify(input.datosAntes)
          : null,
        datosDespues: input.datosDespues
          ? JSON.stringify(input.datosDespues)
          : null,
        ip: input.ip ?? null,
      }),
    );
  }

  async findRecent(limit = 100): Promise<Audit[]> {
    return await this.auditRepository.find({
      order: { fecha: 'DESC', id: 'DESC' },
      take: Math.min(limit, 500),
    });
  }
}
