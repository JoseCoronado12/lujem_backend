import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase3Catalog1771000000000 implements MigrationInterface {
  name = 'Phase3Catalog1771000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`productos\`
        ADD \`categoria\` varchar(255) NULL,
        ADD \`principio_activo\` varchar(255) NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`productos\`
        DROP COLUMN \`principio_activo\`,
        DROP COLUMN \`categoria\`
    `);
  }
}
