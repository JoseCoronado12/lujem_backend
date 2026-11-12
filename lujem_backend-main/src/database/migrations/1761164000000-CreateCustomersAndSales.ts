import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCustomersAndSales1761164000000
  implements MigrationInterface
{
  name = 'CreateCustomersAndSales1761164000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    for (const tableName of ['clientes', 'ventas', 'detalles_venta']) {
      if (await queryRunner.hasTable(tableName)) {
        throw new Error(
          `Table ${tableName} already exists; inspect it before applying this migration.`,
        );
      }
    }

    await queryRunner.query(`
      CREATE TABLE \`clientes\` (
        \`identificacion\` varchar(30) NOT NULL,
        \`tipo_documento\` enum('CC','CE','TI','PASAPORTE','NIT','OTRO') NOT NULL,
        \`nombres\` varchar(255) NOT NULL,
        \`apellidos\` varchar(255) NOT NULL,
        \`correo\` varchar(255) NOT NULL,
        \`telefono\` varchar(30) NOT NULL,
        \`direccion\` varchar(255) NOT NULL,
        \`contrasena_hash\` varchar(255) NULL,
        PRIMARY KEY (\`identificacion\`),
        UNIQUE INDEX \`IDX_clientes_correo\` (\`correo\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`ventas\` (
        \`id_venta\` int NOT NULL AUTO_INCREMENT,
        \`identificacion_cliente\` varchar(30) NOT NULL,
        \`id_usuario\` int NULL,
        \`canal\` enum('PRESENCIAL','EN_LINEA') NOT NULL,
        \`fecha_hora\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`subtotal\` decimal(10,2) NOT NULL,
        \`descuento\` decimal(10,2) NOT NULL DEFAULT 0.00,
        \`total\` decimal(10,2) NOT NULL,
        \`estado\` enum('PENDIENTE_PAGO','PAGO_EN_REVISION','PAGADA','ENTREGADA','ANULADA') NOT NULL DEFAULT 'PENDIENTE_PAGO',
        PRIMARY KEY (\`id_venta\`),
        INDEX \`IDX_ventas_cliente\` (\`identificacion_cliente\`),
        INDEX \`IDX_ventas_usuario\` (\`id_usuario\`),
        CONSTRAINT \`FK_ventas_cliente\`
          FOREIGN KEY (\`identificacion_cliente\`) REFERENCES \`clientes\`(\`identificacion\`)
          ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT \`FK_ventas_usuario\`
          FOREIGN KEY (\`id_usuario\`) REFERENCES \`users\`(\`id\`)
          ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`detalles_venta\` (
        \`id_detalle\` int NOT NULL AUTO_INCREMENT,
        \`id_venta\` int NOT NULL,
        \`codigo_barras\` varchar(100) NOT NULL,
        \`cantidad\` int NOT NULL,
        \`valor_unitario\` decimal(10,2) NOT NULL,
        \`subtotal\` decimal(10,2) NOT NULL,
        PRIMARY KEY (\`id_detalle\`),
        INDEX \`IDX_detalles_venta_venta\` (\`id_venta\`),
        INDEX \`IDX_detalles_venta_producto\` (\`codigo_barras\`),
        CONSTRAINT \`FK_detalles_venta_venta\`
          FOREIGN KEY (\`id_venta\`) REFERENCES \`ventas\`(\`id_venta\`)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`FK_detalles_venta_producto\`
          FOREIGN KEY (\`codigo_barras\`) REFERENCES \`productos\`(\`codigo_barras\`)
          ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    for (const tableName of ['detalles_venta', 'ventas', 'clientes']) {
      if (await queryRunner.hasTable(tableName)) {
        const [{ total }] = await queryRunner.query(
          `SELECT COUNT(*) AS total FROM \`${tableName}\``,
        );
        if (Number(total) > 0) {
          throw new Error(
            `Cannot drop ${tableName} while it contains records.`,
          );
        }
      }
    }

    await queryRunner.query('DROP TABLE IF EXISTS `detalles_venta`');
    await queryRunner.query('DROP TABLE IF EXISTS `ventas`');
    await queryRunner.query('DROP TABLE IF EXISTS `clientes`');
  }
}
