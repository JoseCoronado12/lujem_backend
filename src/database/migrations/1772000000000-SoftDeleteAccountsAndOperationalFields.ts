import { MigrationInterface, QueryRunner } from 'typeorm';

export class SoftDeleteAccountsAndOperationalFields1772000000000
  implements MigrationInterface
{
  name = 'SoftDeleteAccountsAndOperationalFields1772000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `users` ADD `activo` tinyint NOT NULL DEFAULT 1');
    await queryRunner.query('ALTER TABLE `clientes` ADD `activo` tinyint NOT NULL DEFAULT 1');
    await queryRunner.query('ALTER TABLE `proveedores` ADD `activo` tinyint NOT NULL DEFAULT 1');
    await queryRunner.query('ALTER TABLE `productos` ADD `activo` tinyint NOT NULL DEFAULT 1');

    await queryRunner.query(`
      ALTER TABLE \`users\`
        ADD \`refresh_token_hash\` varchar(255) NULL,
        ADD \`reset_token_hash\` varchar(255) NULL,
        ADD \`reset_token_expires\` datetime NULL,
        ADD \`email_verificado\` tinyint NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE \`clientes\`
        ADD \`refresh_token_hash\` varchar(255) NULL,
        ADD \`reset_token_hash\` varchar(255) NULL,
        ADD \`reset_token_expires\` datetime NULL,
        ADD \`email_verificado\` tinyint NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      CREATE TABLE \`auditoria\` (
        \`id_auditoria\` bigint unsigned NOT NULL AUTO_INCREMENT,
        \`actor_tipo\` enum('STAFF','CUSTOMER','SYSTEM') NOT NULL,
        \`actor_id\` varchar(100) NULL,
        \`accion\` varchar(100) NOT NULL,
        \`entidad\` varchar(100) NOT NULL,
        \`entidad_id\` varchar(100) NULL,
        \`datos_antes\` longtext NULL,
        \`datos_despues\` longtext NULL,
        \`ip\` varchar(45) NULL,
        \`fecha\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id_auditoria\`),
        INDEX \`IDX_auditoria_fecha\` (\`fecha\`)
      ) ENGINE=InnoDB
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `auditoria`');
    await queryRunner.query(`
      ALTER TABLE \`clientes\`
        DROP COLUMN \`email_verificado\`,
        DROP COLUMN \`reset_token_expires\`,
        DROP COLUMN \`reset_token_hash\`,
        DROP COLUMN \`refresh_token_hash\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`users\`
        DROP COLUMN \`email_verificado\`,
        DROP COLUMN \`reset_token_expires\`,
        DROP COLUMN \`reset_token_hash\`,
        DROP COLUMN \`refresh_token_hash\`
    `);
    await queryRunner.query('ALTER TABLE `productos` DROP COLUMN `activo`');
    await queryRunner.query('ALTER TABLE `proveedores` DROP COLUMN `activo`');
    await queryRunner.query('ALTER TABLE `clientes` DROP COLUMN `activo`');
    await queryRunner.query('ALTER TABLE `users` DROP COLUMN `activo`');
  }
}
