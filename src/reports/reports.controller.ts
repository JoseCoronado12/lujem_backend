import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { Roles } from '../user/decorators/roles.decorator';
import { RolesGuard } from '../user/guards/roles.guard';
import { ReportQueryDto } from './dto/report-query.dto';
import { ReportsService } from './reports.service';
import PDFDocument = require('pdfkit');

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

  @Get('sales/export/pdf')
  async exportSalesPdf(@Query() query: ReportQueryDto, @Res() res: Response) {
    const report = await this.reportsService.sales(query);
    const chunks: Buffer[] = [];
    const document = new PDFDocument({ margin: 40 });
    document.on('data', (chunk: Buffer) => chunks.push(chunk));
    const pdf = new Promise<Buffer>((resolve, reject) => {
      document.on('end', () => resolve(Buffer.concat(chunks)));
      document.on('error', reject);
    });

    document.fontSize(16).text('Reporte de ventas LUJEM');
    document.moveDown();
    document.fontSize(10).text(`Cantidad: ${report.count} - Total: ${report.total.toFixed(2)}`);
    document.moveDown();
    for (const sale of report.sales) {
      document.text(
        `#${sale.id} | ${sale.fechaHora} | ${sale.estado} | ${Number(sale.total).toFixed(2)}`,
      );
    }
    document.end();
    const buffer = await pdf;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="ventas.pdf"');
    res.send(buffer);
  }
}
