import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase2InventoryPrescriptionsInvoicingAndCash1770000000000
  implements MigrationInterface
{
  name = 'Phase2InventoryPrescriptionsInvoicingAndCash1770000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`movimientos_inventario\` (
        \`id_movimiento\` bigint unsigned NOT NULL AUTO_INCREMENT,
        \`codigo_barras\` varchar(100) NOT NULL,
        \`id_usuario\` int NOT NULL,
        \`tipo\` enum('ENTRADA','SALIDA','AJUSTE','MERMA','DEVOLUCION') NOT NULL,
        \`cantidad\` int NOT NULL,
        \`stock_anterior\` int NOT NULL,
        \`stock_nuevo\` int NOT NULL,
        \`motivo\` varchar(255) NOT NULL,
        \`referencia\` varchar(100) NULL,
        \`fecha\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id_movimiento\`),
        INDEX \`IDX_movimientos_producto\` (\`codigo_barras\`),
        INDEX \`IDX_movimientos_fecha\` (\`fecha\`),
        CONSTRAINT \`FK_movimiento_producto\` FOREIGN KEY (\`codigo_barras\`) REFERENCES \`productos\`(\`codigo_barras\`) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT \`FK_movimiento_usuario\` FOREIGN KEY (\`id_usuario\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`formulas_medicas\` (
        \`id_formula\` bigint unsigned NOT NULL AUTO_INCREMENT,
        \`id_venta\` int NOT NULL,
        \`identificacion_cliente\` varchar(30) NOT NULL,
        \`id_usuario\` int NOT NULL,
        \`numero_formula\` varchar(100) NOT NULL,
        \`nombre_medico\` varchar(255) NOT NULL,
        \`fecha_formula\` date NOT NULL,
        \`tipo_control\` enum('NINGUNO','CONTROLADO','PSICOTROPICO') NOT NULL,
        \`archivo_url\` varchar(500) NULL,
        \`fecha_registro\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id_formula\`),
        CONSTRAINT \`FK_formula_venta\` FOREIGN KEY (\`id_venta\`) REFERENCES \`ventas\`(\`id_venta\`) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT \`FK_formula_cliente\` FOREIGN KEY (\`identificacion_cliente\`) REFERENCES \`clientes\`(\`identificacion\`) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT \`FK_formula_usuario\` FOREIGN KEY (\`id_usuario\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`turnos_caja\` (
        \`id_turno\` bigint unsigned NOT NULL AUTO_INCREMENT,
        \`id_usuario\` int NOT NULL,
        \`apertura\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`monto_apertura\` decimal(12,2) NOT NULL,
        \`cierre\` datetime NULL,
        \`monto_contado\` decimal(12,2) NULL,
        \`monto_esperado\` decimal(12,2) NULL,
        \`diferencia\` decimal(12,2) NULL,
        \`estado\` enum('ABIERTA','CERRADA') NOT NULL DEFAULT 'ABIERTA',
        \`observaciones\` varchar(255) NULL,
        PRIMARY KEY (\`id_turno\`),
        CONSTRAINT \`FK_turno_usuario\` FOREIGN KEY (\`id_usuario\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      ALTER TABLE \`factura_venta\`
        ADD \`estado_electronico\` enum('NO_ENVIADA','ENVIADA','ACEPTADA','RECHAZADA') NOT NULL DEFAULT 'NO_ENVIADA',
        ADD \`cufe\` varchar(255) NULL,
        ADD \`xml_url\` varchar(500) NULL,
        ADD \`respuesta_proveedor\` text NULL,
        ADD \`fecha_electronica\` datetime NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`ventas\`
        ADD INDEX \`IDX_ventas_estado\` (\`estado\`)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `ventas` DROP INDEX `IDX_ventas_estado`');
    await queryRunner.query(`
      ALTER TABLE \`factura_venta\`
        DROP COLUMN \`fecha_electronica\`,
        DROP COLUMN \`respuesta_proveedor\`,
        DROP COLUMN \`xml_url\`,
        DROP COLUMN \`cufe\`,
        DROP COLUMN \`estado_electronico\`
    `);
    await queryRunner.query('DROP TABLE IF EXISTS `turnos_caja`');
    await queryRunner.query('DROP TABLE IF EXISTS `formulas_medicas`');
    await queryRunner.query('DROP TABLE IF EXISTS `movimientos_inventario`');
  }
}
