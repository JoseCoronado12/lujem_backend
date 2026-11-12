import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePurchaseOrders1761163000000 implements MigrationInterface {
  name = 'CreatePurchaseOrders1761163000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    for (const tableName of ['ordenes_compra', 'detalles_orden_compra']) {
      if (await queryRunner.hasTable(tableName)) {
        throw new Error(
          `Table ${tableName} already exists; inspect it before applying this migration.`,
        );
      }
    }

    await queryRunner.query(`
      CREATE TABLE \`ordenes_compra\` (
        \`id_orden_compra\` int NOT NULL AUTO_INCREMENT,
        \`codigo_proveedor\` int NOT NULL,
        \`id_usuario\` int NOT NULL,
        \`fecha\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`estado\` enum('BORRADOR','ENVIADA','RECIBIDA','CANCELADA') NOT NULL DEFAULT 'BORRADOR',
        \`total\` decimal(10,2) NOT NULL,
        \`observaciones\` varchar(255) NULL,
        PRIMARY KEY (\`id_orden_compra\`),
        INDEX \`IDX_ordenes_compra_proveedor\` (\`codigo_proveedor\`),
        INDEX \`IDX_ordenes_compra_usuario\` (\`id_usuario\`),
        CONSTRAINT \`FK_ordenes_compra_proveedor\`
          FOREIGN KEY (\`codigo_proveedor\`) REFERENCES \`proveedores\`(\`codigo_proveedor\`)
          ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT \`FK_ordenes_compra_usuario\`
          FOREIGN KEY (\`id_usuario\`) REFERENCES \`users\`(\`id\`)
          ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`detalles_orden_compra\` (
        \`id_detalle_orden\` int NOT NULL AUTO_INCREMENT,
        \`id_orden_compra\` int NOT NULL,
        \`codigo_barras\` varchar(100) NOT NULL,
        \`cantidad\` int NOT NULL,
        \`costo_unitario\` decimal(10,2) NOT NULL,
        \`subtotal\` decimal(10,2) NOT NULL,
        PRIMARY KEY (\`id_detalle_orden\`),
        INDEX \`IDX_detalles_orden_compra_orden\` (\`id_orden_compra\`),
        INDEX \`IDX_detalles_orden_compra_producto\` (\`codigo_barras\`),
        CONSTRAINT \`FK_detalles_orden_compra_orden\`
          FOREIGN KEY (\`id_orden_compra\`) REFERENCES \`ordenes_compra\`(\`id_orden_compra\`)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`FK_detalles_orden_compra_producto\`
          FOREIGN KEY (\`codigo_barras\`) REFERENCES \`productos\`(\`codigo_barras\`)
          ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    for (const tableName of ['detalles_orden_compra', 'ordenes_compra']) {
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

    await queryRunner.query('DROP TABLE IF EXISTS `detalles_orden_compra`');
    await queryRunner.query('DROP TABLE IF EXISTS `ordenes_compra`');
  }
}
