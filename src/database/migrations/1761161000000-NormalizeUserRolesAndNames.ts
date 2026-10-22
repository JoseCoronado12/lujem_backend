import { MigrationInterface, QueryRunner } from 'typeorm';

export class NormalizeUserRolesAndNames1761161000000
  implements MigrationInterface
{
  name = 'NormalizeUserRolesAndNames1761161000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('users'))) {
      throw new Error('The users table is missing; run the initial migration first.');
    }

    if (await queryRunner.hasTable('roles')) {
      throw new Error('The roles table already exists; inspect the schema before migrating.');
    }

    const [{ total }] = await queryRunner.query(
      'SELECT COUNT(*) AS total FROM `users`',
    );
    if (Number(total) > 0) {
      throw new Error(
        'Users already exist. Export and map their names before applying this migration.',
      );
    }

    await queryRunner.query(`
      CREATE TABLE \`roles\` (
        \`id_rol\` tinyint unsigned NOT NULL AUTO_INCREMENT,
        \`nombre\` varchar(50) NOT NULL,
        PRIMARY KEY (\`id_rol\`),
        UNIQUE INDEX \`IDX_roles_nombre\` (\`nombre\`)
      ) ENGINE=InnoDB
    `);
    await queryRunner.query(
      "INSERT INTO `roles` (`nombre`) VALUES ('USER'), ('ADMIN')",
    );
    await queryRunner.query(`
      ALTER TABLE \`users\`
        ADD \`nombres\` varchar(255) NOT NULL AFTER \`email\`,
        ADD \`apellidos\` varchar(255) NOT NULL AFTER \`nombres\`,
        ADD \`id_rol\` tinyint unsigned NOT NULL DEFAULT 1,
        DROP COLUMN \`fullName\`,
        DROP COLUMN \`role\`,
        ADD CONSTRAINT \`FK_users_roles_id_rol\`
          FOREIGN KEY (\`id_rol\`) REFERENCES \`roles\`(\`id_rol\`)
          ON DELETE RESTRICT ON UPDATE CASCADE
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const [{ total }] = await queryRunner.query(
      'SELECT COUNT(*) AS total FROM `users`',
    );
    if (Number(total) > 0) {
      throw new Error(
        'Cannot revert while users exist; it would recombine names and lose their original formatting.',
      );
    }

    await queryRunner.query(`
      ALTER TABLE \`users\`
        DROP FOREIGN KEY \`FK_users_roles_id_rol\`,
        DROP COLUMN \`id_rol\`,
        ADD \`fullName\` varchar(255) NOT NULL,
        ADD \`role\` varchar(255) NOT NULL DEFAULT 'user',
        DROP COLUMN \`nombres\`,
        DROP COLUMN \`apellidos\`
    `);
    await queryRunner.query('DROP TABLE `roles`');
  }
}
