import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CustomerJwtPayload } from './interfaces/customer-jwt-payload.interface';

@Injectable()
export class CustomerJwtStrategy extends PassportStrategy(
  Strategy,
  'customer-jwt',
) {
  constructor(
    configService: ConfigService,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: CustomerJwtPayload): Promise<Customer> {
    if (payload.kind !== 'customer' || !payload.sub) {
      throw new UnauthorizedException('Token inválido');
    }

    const customer = await this.customerRepository.findOneBy({
      identificacion: payload.sub,
    });
    if (!customer) {
      throw new UnauthorizedException('Token inválido');
    }

    return customer;
  }
}
