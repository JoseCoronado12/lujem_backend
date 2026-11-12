import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInvoicesAndProductReminders1761166000000
  implements MigrationInterface
{
  name = 'CreateInvoicesAndProductReminders1761166000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    for (const tableName of ['factura_venta', 'recordatorio_producto']) {
      if (await queryRunner.hasTable(tableName)) {
        throw new Error(
          `Table ${tableName} already exists; inspect it before applying this migration.`,
        );
      }
    }

    await queryRunner.query(`
      CREATE TABLE \`factura_venta\` (
        \`id_factura\` int NOT NULL AUTO_INCREMENT,
        \`numero_factura\` varchar(30) NOT NULL,
        \`id_venta\` int NOT NULL,
        \`fecha_emision\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`subtotal\` decimal(10,2) NOT NULL,
        \`descuento\` decimal(10,2) NOT NULL DEFAULT 0.00,
        \`impuestos\` decimal(10,2) NOT NULL DEFAULT 0.00,
        \`total\` decimal(10,2) NOT NULL,
        PRIMARY KEY (\`id_factura\`),
        UNIQUE INDEX \`IDX_factura_venta_numero\` (\`numero_factura\`),
        UNIQUE INDEX \`IDX_factura_venta_venta\` (\`id_venta\`),
        CONSTRAINT \`FK_factura_venta_venta\`
          FOREIGN KEY (\`id_venta\`) REFERENCES \`ventas\`(\`id_venta\`)
          ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      INSERT INTO \`factura_venta\`
        (\`numero_factura\`, \`id_venta\`, \`fecha_emision\`, \`subtotal\`,
         \`descuento\`, \`impuestos\`, \`total\`)
      SELECT
        CONCAT('FAC-', LPAD(\`id_venta\`, 8, '0')),
        \`id_venta\`,
        \`fecha_hora\`,
        \`subtotal\`,
        \`descuento\`,
        0.00,
        \`total\`
      FROM \`ventas\`
      WHERE \`estado\` IN ('PAGADA', 'ENTREGADA')
    `);

    await queryRunner.query(`
      CREATE TABLE \`recordatorio_producto\` (
        \`id_recordatorio\` int NOT NULL AUTO_INCREMENT,
        \`identificacion_cliente\` varchar(30) NOT NULL,
        \`codigo_barras\` varchar(100) NOT NULL,
        \`fecha_recordatorio\` date NOT NULL,
        \`frecuencia_dias\` smallint NOT NULL,
        \`mensaje\` varchar(255) NOT NULL,
        \`activo\` tinyint NOT NULL DEFAULT 1,
        PRIMARY KEY (\`id_recordatorio\`),
        INDEX \`IDX_recordatorio_producto_cliente\` (\`identificacion_cliente\`),
        INDEX \`IDX_recordatorio_producto_codigo\` (\`codigo_barras\`),
        INDEX \`IDX_recordatorio_producto_fecha_activo\` (\`fecha_recordatorio\`, \`activo\`),
        CONSTRAINT \`FK_recordatorio_producto_cliente\`
          FOREIGN KEY (\`identificacion_cliente\`) REFERENCES \`clientes\`(\`identificacion\`)
          ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT \`FK_recordatorio_producto_codigo\`
          FOREIGN KEY (\`codigo_barras\`) REFERENCES \`productos\`(\`codigo_barras\`)
          ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    for (const tableName of ['recordatorio_producto', 'factura_venta']) {
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

    await queryRunner.query('DROP TABLE IF EXISTS `recordatorio_producto`');
    await queryRunner.query('DROP TABLE IF EXISTS `factura_venta`');
  }
}
