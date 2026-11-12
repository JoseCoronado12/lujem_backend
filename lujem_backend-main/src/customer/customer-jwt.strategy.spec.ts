import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { describe, expect, it, jest } from '@jest/globals';
import { Repository } from 'typeorm';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserService } from '../user/user.service';
import { Customer } from './entities/customer.entity';
import { CustomerJwtPayload } from './interfaces/customer-jwt-payload.interface';
import { CustomerJwtStrategy } from './customer-jwt.strategy';

describe('customer JWT strategy', () => {
  const configService = {
    getOrThrow: jest.fn(() => 'test-secret'),
  } as unknown as ConfigService;

  it('rejects a customer token on the staff strategy', async () => {
    const userService = {
      findById: jest.fn(),
    } as unknown as UserService;
    const strategy = new JwtStrategy(configService, userService);

    await expect(
      strategy.validate({
        sub: 1,
        email: 'customer@example.com',
        role: 'CUSTOMER',
        kind: 'customer',
      } as JwtPayload),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(userService.findById).not.toHaveBeenCalled();
  });

  it('rejects a staff token on the customer strategy', async () => {
    const customerRepository = {
      findOneBy: jest.fn(),
    } as unknown as Repository<Customer>;
    const strategy = new CustomerJwtStrategy(
      configService,
      customerRepository,
    );

    await expect(
      strategy.validate({
        sub: '',
        correo: 'staff@example.com',
        kind: 'customer',
      } satisfies CustomerJwtPayload),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(customerRepository.findOneBy).not.toHaveBeenCalled();
  });
});
