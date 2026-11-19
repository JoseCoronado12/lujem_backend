import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import type { User } from '../user/entities/user.entity';
import { Roles } from '../user/decorators/roles.decorator';
import { RolesGuard } from '../user/guards/roles.guard';
import { CashService } from './cash.service';
import { CloseCashDto, OpenCashDto } from './dto/open-cash.dto';

@Controller('cash-register')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'CAJERO')
export class CashController {
  constructor(private readonly cashService: CashService) {}

  @Post('open')
  open(@Body() dto: OpenCashDto, @Req() req: Request & { user: User }) {
    return this.cashService.open(dto, req.user.id);
  }

  @Get('active')
  getActive(@Req() req: Request & { user: User }) {
    return this.cashService.getActive(req.user.id);
  }

  @Patch(':id/close')
  close(@Param('id') id: string, @Body() dto: CloseCashDto) {
    return this.cashService.close(id, dto);
  }
}
