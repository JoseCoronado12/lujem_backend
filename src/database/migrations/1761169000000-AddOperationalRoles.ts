import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOperationalRoles1761169000000
  implements MigrationInterface
{
  name = 'AddOperationalRoles1761169000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT IGNORE INTO \`roles\` (\`nombre\`)
      VALUES ('CAJERO'), ('REGENTE'), ('BODEGA')
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM \`roles\`
      WHERE \`nombre\` IN ('CAJERO', 'REGENTE', 'BODEGA')
        AND NOT EXISTS (
          SELECT 1 FROM \`users\` WHERE \`users\`.\`id_rol\` = \`roles\`.\`id_rol\`
        )
    `);
  }
}
