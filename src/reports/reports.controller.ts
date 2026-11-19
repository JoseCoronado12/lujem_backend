import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { Roles } from '../user/decorators/roles.decorator';
import { RolesGuard } from '../user/guards/roles.guard';
import { ReportQueryDto } from './dto/report-query.dto';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'REGENTE')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  dashboard(@Query() query: ReportQueryDto) {
    return this.reportsService.dashboard(query);
  }

  @Get('sales')
  sales(@Query() query: ReportQueryDto) {
    return this.reportsService.sales(query);
  }

  @Get('purchases')
  purchases(@Query() query: ReportQueryDto) {
    return this.reportsService.purchases(query);
  }

  @Get('top-products')
  topProducts() {
    return this.reportsService.topProducts();
  }

  @Get('sales/export/csv')
  async exportSales(@Query() query: ReportQueryDto, @Res() res: Response) {
    const report = await this.reportsService.sales(query);
    const rows = report.sales.map((sale) =>
      [sale.id, sale.fechaHora, sale.estado, sale.total].join(','),
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="ventas.csv"');
    res.send(['id,fecha,estado,total', ...rows].join('\n'));
  }
}
