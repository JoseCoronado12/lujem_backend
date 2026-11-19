import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CashRegisterSession } from './entities/cash-register-session.entity';
import { CloseCashDto, OpenCashDto } from './dto/open-cash.dto';
import { User } from '../user/entities/user.entity';
import { Payment } from '../payment/entities/payment.entity';

@Injectable()
export class CashService {
  constructor(
    @InjectRepository(CashRegisterSession)
    private readonly sessionRepository: Repository<CashRegisterSession>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async open(dto: OpenCashDto, userId: number): Promise<CashRegisterSession> {
    const active = await this.sessionRepository.findOne({
      where: { usuario: { id: userId }, estado: 'ABIERTA' },
    });
    if (active) throw new BadRequestException('El usuario ya tiene una caja abierta');
    const session = this.sessionRepository.create({
      usuario: { id: userId } as User,
      montoApertura: dto.montoApertura,
      observaciones: dto.observaciones ?? null,
      estado: 'ABIERTA',
    });
    return await this.sessionRepository.save(session);
  }

  async close(id: string, dto: CloseCashDto): Promise<CashRegisterSession> {
    const session = await this.sessionRepository.findOne({
      where: { id },
      relations: { usuario: true },
    });
    if (!session) throw new NotFoundException(`Turno de caja ${id} no encontrado`);
    if (session.estado === 'CERRADA') throw new BadRequestException('La caja ya está cerrada');

    const cashPayments = await this.paymentRepository
      .createQueryBuilder('pago')
      .leftJoin('pago.metodo', 'metodo')
      .leftJoin('pago.usuario', 'usuario')
      .where('metodo.nombre = :method', { method: 'EFECTIVO' })
      .andWhere('pago.estado = :status', { status: 'APROBADO' })
      .andWhere('usuario.id = :userId', { userId: session.usuario.id })
      .andWhere('pago.fecha_registro >= :opened', { opened: session.apertura })
      .getMany();

    const cashIncome = cashPayments.reduce(
      (sum, payment) => sum + Number(payment.monto),
      0,
    );
    const expected = Number(session.montoApertura) + cashIncome;
    session.montoEsperado = expected;
    session.montoContado = dto.montoContado;
    session.diferencia = dto.montoContado - expected;
    session.cierre = new Date();
    session.estado = 'CERRADA';
    session.observaciones = dto.observaciones ?? session.observaciones;
    return await this.sessionRepository.save(session);
  }

  async getActive(userId: number): Promise<CashRegisterSession | null> {
    return await this.sessionRepository.findOne({
      where: { usuario: { id: userId }, estado: 'ABIERTA' },
      relations: { usuario: true },
    });
  }
}
