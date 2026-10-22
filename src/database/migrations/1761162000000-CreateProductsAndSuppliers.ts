import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductsAndSuppliers1761162000000
  implements MigrationInterface
{
  name = 'CreateProductsAndSuppliers1761162000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    for (const tableName of ['productos', 'proveedores']) {
      if (await queryRunner.hasTable(tableName)) {
        throw new Error(
          `Table ${tableName} already exists; inspect it before applying this migration.`,
        );
      }
    }

    await queryRunner.query(`
      CREATE TABLE \`proveedores\` (
        \`codigo_proveedor\` int NOT NULL AUTO_INCREMENT,
        \`nit\` varchar(20) NOT NULL,
        \`nombre\` varchar(255) NOT NULL,
        \`telefono\` varchar(30) NOT NULL,
        \`correo\` varchar(255) NOT NULL,
        \`direccion\` varchar(255) NOT NULL,
        \`fecha_contrato\` date NOT NULL,
        PRIMARY KEY (\`codigo_proveedor\`),
        UNIQUE INDEX \`IDX_proveedores_nit\` (\`nit\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE \`productos\` (
        \`codigo_barras\` varchar(100) NOT NULL,
        \`nombre_producto\` varchar(255) NOT NULL,
        \`laboratorio\` varchar(255) NOT NULL,
        \`presentacion\` varchar(255) NOT NULL,
        \`registro_invima\` varchar(100) NOT NULL,
        \`requiere_formula\` tinyint NOT NULL DEFAULT 0,
        \`valor_unitario\` decimal(10,2) NOT NULL,
        \`stock\` int NOT NULL DEFAULT 0,
        \`stock_minimo\` int NOT NULL DEFAULT 0,
        \`lote\` varchar(100) NOT NULL,
        \`fecha_vencimiento\` date NOT NULL,
        \`ubicacion\` varchar(100) NOT NULL,
        PRIMARY KEY (\`codigo_barras\`)
      ) ENGINE=InnoDB
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    for (const tableName of ['productos', 'proveedores']) {
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

    await queryRunner.query('DROP TABLE IF EXISTS `productos`');
    await queryRunner.query('DROP TABLE IF EXISTS `proveedores`');
  }
}
