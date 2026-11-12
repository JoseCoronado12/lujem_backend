import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePaymentsAndReceipts1761165000000
  implements MigrationInterface
{
  name = 'CreatePaymentsAndReceipts1761165000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      'metodos_pago',
      'cuentas_bancarias',
      'pagos',
      'comprobantes_transferencia',
      'validaciones_pago',
    ];
    for (const tableName of tables) {
      if (await queryRunner.hasTable(tableName)) {
        throw new Error(
          `Table ${tableName} already exists; inspect it before applying this migration.`,
        );
      }
    }

    await queryRunner.query(`
      CREATE TABLE \`metodos_pago\` (
        \`id_metodo_pago\` tinyint unsigned NOT NULL AUTO_INCREMENT,
        \`nombre\` varchar(30) NOT NULL,
        \`requiere_comprobante\` tinyint NOT NULL DEFAULT 0,
        PRIMARY KEY (\`id_metodo_pago\`),
        UNIQUE INDEX \`IDX_metodos_pago_nombre\` (\`nombre\`)
      ) ENGINE=InnoDB
    `);
    await queryRunner.query(`
      INSERT INTO \`metodos_pago\`
        (\`id_metodo_pago\`, \`nombre\`, \`requiere_comprobante\`)
      VALUES (1, 'EFECTIVO', 0), (2, 'TRANSFERENCIA', 1)
    `);

    await queryRunner.query(`
      CREATE TABLE \`cuentas_bancarias\` (
        \`id_cuenta\` smallint unsigned NOT NULL AUTO_INCREMENT,
        \`banco\` varchar(100) NOT NULL,
        \`tipo_cuenta\` enum('AHORROS','CORRIENTE') NOT NULL,
        \`numero_cuenta\` varchar(50) NOT NULL,
        \`titular\` varchar(255) NOT NULL,
        \`activa\` tinyint NOT NULL DEFAULT 1,
        PRIMARY KEY (\`id_cuenta\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`pagos\` (
        \`id_pago\` int NOT NULL AUTO_INCREMENT,
        \`id_venta\` int NOT NULL,
        \`id_metodo_pago\` tinyint unsigned NOT NULL,
        \`id_cuenta_destino\` smallint unsigned NULL,
        \`monto\` decimal(10,2) NOT NULL,
        \`monto_recibido\` decimal(10,2) NULL,
        \`cambio\` decimal(10,2) NULL,
        \`estado\` enum('PENDIENTE','EN_REVISION','APROBADO','RECHAZADO') NOT NULL DEFAULT 'PENDIENTE',
        \`id_usuario\` int NOT NULL,
        \`fecha_registro\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`fecha_aprobacion\` datetime NULL,
        PRIMARY KEY (\`id_pago\`),
        INDEX \`IDX_pagos_venta\` (\`id_venta\`),
        INDEX \`IDX_pagos_metodo\` (\`id_metodo_pago\`),
        INDEX \`IDX_pagos_cuenta\` (\`id_cuenta_destino\`),
        INDEX \`IDX_pagos_usuario\` (\`id_usuario\`),
        CONSTRAINT \`FK_pagos_venta\`
          FOREIGN KEY (\`id_venta\`) REFERENCES \`ventas\`(\`id_venta\`)
          ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT \`FK_pagos_metodo\`
          FOREIGN KEY (\`id_metodo_pago\`) REFERENCES \`metodos_pago\`(\`id_metodo_pago\`)
          ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT \`FK_pagos_cuenta\`
          FOREIGN KEY (\`id_cuenta_destino\`) REFERENCES \`cuentas_bancarias\`(\`id_cuenta\`)
          ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT \`FK_pagos_usuario\`
          FOREIGN KEY (\`id_usuario\`) REFERENCES \`users\`(\`id\`)
          ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`comprobantes_transferencia\` (
        \`id_comprobante\` int NOT NULL AUTO_INCREMENT,
        \`id_pago\` int NOT NULL,
        \`ruta_imagen\` varchar(255) NOT NULL,
        \`nombre_archivo\` varchar(255) NOT NULL,
        \`tipo_mime\` varchar(100) NOT NULL,
        \`tamano_bytes\` int NOT NULL,
        \`hash_sha256\` char(64) NOT NULL,
        \`banco_origen\` varchar(100) NOT NULL,
        \`numero_referencia\` varchar(100) NOT NULL,
        \`fecha_transferencia\` datetime NOT NULL,
        \`fecha_carga\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id_comprobante\`),
        INDEX \`IDX_comprobantes_pago\` (\`id_pago\`),
        CONSTRAINT \`FK_comprobantes_pago\`
          FOREIGN KEY (\`id_pago\`) REFERENCES \`pagos\`(\`id_pago\`)
          ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`validaciones_pago\` (
        \`id_validacion\` int NOT NULL AUTO_INCREMENT,
        \`id_comprobante\` int NOT NULL,
        \`id_usuario\` int NOT NULL,
        \`resultado\` enum('APROBADO','RECHAZADO') NOT NULL,
        \`motivo_rechazo\` varchar(255) NULL,
        \`fecha_validacion\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id_validacion\`),
        UNIQUE INDEX \`IDX_validaciones_comprobante\` (\`id_comprobante\`),
        INDEX \`IDX_validaciones_usuario\` (\`id_usuario\`),
        CONSTRAINT \`FK_validaciones_comprobante\`
          FOREIGN KEY (\`id_comprobante\`) REFERENCES \`comprobantes_transferencia\`(\`id_comprobante\`)
          ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT \`FK_validaciones_usuario\`
          FOREIGN KEY (\`id_usuario\`) REFERENCES \`users\`(\`id\`)
          ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    for (const tableName of [
      'validaciones_pago',
      'comprobantes_transferencia',
      'pagos',
      'cuentas_bancarias',
    ]) {
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

    await queryRunner.query('DROP TABLE IF EXISTS `validaciones_pago`');
    await queryRunner.query('DROP TABLE IF EXISTS `comprobantes_transferencia`');
    await queryRunner.query('DROP TABLE IF EXISTS `pagos`');
    await queryRunner.query('DROP TABLE IF EXISTS `cuentas_bancarias`');
    await queryRunner.query('DROP TABLE IF EXISTS `metodos_pago`');
  }
}
