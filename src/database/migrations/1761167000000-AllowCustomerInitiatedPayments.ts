import { MigrationInterface, QueryRunner } from 'typeorm';

export class AllowCustomerInitiatedPayments1761167000000
  implements MigrationInterface
{
  name = 'AllowCustomerInitiatedPayments1761167000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('pagos'))) {
      throw new Error('The pagos table is missing; run previous migrations first.');
    }

    await queryRunner.query(`
      ALTER TABLE \`pagos\`
        MODIFY \`id_usuario\` int NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('pagos'))) {
      return;
    }

    const [{ total }] = await queryRunner.query(
      'SELECT COUNT(*) AS total FROM `pagos` WHERE `id_usuario` IS NULL',
    );
    if (Number(total) > 0) {
      throw new Error(
        'Cannot require a staff user while customer-initiated payments exist.',
      );
    }

    await queryRunner.query(`
      ALTER TABLE \`pagos\`
        MODIFY \`id_usuario\` int NOT NULL
    `);
  }
}
