import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ProductModule } from './product/product.module';
import { SupplierModule } from './supplier/supplier.module';
import { PurchaseOrderModule } from './purchase-order/purchase-order.module';
import { CustomerModule } from './customer/customer.module';
import { SaleModule } from './sale/sale.module';
import { PaymentModule } from './payment/payment.module';


@Module({
  imports: [
    // Configuración de variables de entorno
    // isGlobal: true hace que ConfigService esté disponible en toda la app
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Configuración de TypeORM con MySQL
    // useFactory permite inyectar ConfigService para leer variables de entorno
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => ({
        type: 'mysql',
        // getOrThrow lanza un error claro si la variable no existe en .env
        host: configService.getOrThrow<string>('DB_HOST'),
        port: Number(configService.getOrThrow<string>('DB_PORT')),
        username: configService.getOrThrow<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD', ''),
        database: configService.getOrThrow<string>('DB_DATABASE'),
        // Carga automáticamente las entidades registradas con forFeature()
        autoLoadEntities: true,
        synchronize: false,
        migrationsRun: false,
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        migrationsTableName: 'typeorm_migrations',
      }),
    }),

    UserModule,

    AuthModule,
    ProductModule,
    SupplierModule,
    PurchaseOrderModule,
    CustomerModule,
    SaleModule,
    PaymentModule,

    // Módulos de la aplicación

  ],
})
export class AppModule {}