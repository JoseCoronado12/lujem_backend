import { MigrationInterface, QueryRunner } from 'typeorm';

export class HighPriorityInventorySales1761168000000
  implements MigrationInterface
{
  name = 'HighPriorityInventorySales1761168000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE `productos` ADD `stock_reservado` int NOT NULL DEFAULT 0',
    );
    await queryRunner.query(
      'ALTER TABLE `productos` ADD `tasa_impuesto` decimal(5,2) NOT NULL DEFAULT 0',
    );

    await queryRunner.query(`
      CREATE TABLE \`lotes_producto\` (
        \`id_lote\` bigint unsigned NOT NULL AUTO_INCREMENT,
        \`codigo_barras\` varchar(100) NOT NULL,
        \`lote\` varchar(100) NOT NULL,
        \`fecha_vencimiento\` date NOT NULL,
        \`cantidad\` int NOT NULL DEFAULT 0,
        \`costo_unitario\` decimal(10,2) NOT NULL,
        \`activo\` tinyint NOT NULL DEFAULT 1,
        PRIMARY KEY (\`id_lote\`),
        INDEX \`IDX_lotes_producto_vencimiento\` (\`fecha_vencimiento\`),
        CONSTRAINT \`FK_lotes_producto\` FOREIGN KEY (\`codigo_barras\`)
          REFERENCES \`productos\`(\`codigo_barras\`)
          ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      ALTER TABLE \`ventas\`
        ADD \`fecha_reserva\` datetime NULL,
        ADD \`motivo_anulacion\` varchar(255) NULL,
        ADD \`fecha_entrega\` datetime NULL,
        ADD \`fecha_devolucion\` datetime NULL,
        ADD \`motivo_devolucion\` varchar(255) NULL,
        ADD \`prescripcion_numero\` varchar(100) NULL,
        ADD \`prescripcion_medico\` varchar(255) NULL,
        ADD \`prescripcion_fecha\` date NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`detalles_orden_compra\`
        ADD \`lote\` varchar(100) NULL,
        ADD \`fecha_vencimiento\` date NULL
    `);

    await queryRunner.query(`
      INSERT INTO \`lotes_producto\`
        (\`codigo_barras\`, \`lote\`, \`fecha_vencimiento\`, \`cantidad\`, \`costo_unitario\`, \`activo\`)
      SELECT
        \`codigo_barras\`,
        \`lote\`,
        \`fecha_vencimiento\`,
        \`stock\`,
        \`valor_unitario\`,
        \`stock\` > 0
      FROM \`productos\`
      WHERE \`lote\` IS NOT NULL AND \`fecha_vencimiento\` IS NOT NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `lotes_producto`');
    await queryRunner.query(`
      ALTER TABLE \`detalles_orden_compra\`
        DROP COLUMN \`fecha_vencimiento\`,
        DROP COLUMN \`lote\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`ventas\`
        DROP COLUMN \`prescripcion_fecha\`,
        DROP COLUMN \`prescripcion_medico\`,
        DROP COLUMN \`prescripcion_numero\`,
        DROP COLUMN \`motivo_devolucion\`,
        DROP COLUMN \`fecha_devolucion\`,
        DROP COLUMN \`fecha_entrega\`,
        DROP COLUMN \`motivo_anulacion\`,
        DROP COLUMN \`fecha_reserva\`
    `);
    await queryRunner.query('ALTER TABLE `productos` DROP COLUMN `tasa_impuesto`');
    await queryRunner.query('ALTER TABLE `productos` DROP COLUMN `stock_reservado`');
  }
}
