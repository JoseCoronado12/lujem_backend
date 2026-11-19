import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../user/decorators/roles.decorator';
import { RolesGuard } from '../user/guards/roles.guard';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer } from './entities/customer.entity';
import { CustomerService } from './customer.service';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('customers')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'CAJERO', 'REGENTE')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  create(@Body() createDto: CreateCustomerDto): Promise<Customer> {
    return this.customerService.create(createDto);
  }

  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.customerService.findPaginated(
      query.page,
      query.limit,
      query.search,
    );
  }

  @Get(':identificacion')
  findOne(
    @Param('identificacion') identificacion: string,
  ): Promise<Customer> {
    return this.customerService.findOne(identificacion);
  }

  @Patch(':identificacion')
  update(
    @Param('identificacion') identificacion: string,
    @Body() updateDto: UpdateCustomerDto,
  ): Promise<Customer> {
    return this.customerService.update(identificacion, updateDto);
  }

  @Delete(':identificacion')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('identificacion') identificacion: string): Promise<void> {
    return this.customerService.remove(identificacion);
  }
}
