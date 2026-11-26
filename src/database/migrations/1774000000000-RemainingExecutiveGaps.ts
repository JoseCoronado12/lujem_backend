import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemainingExecutiveGaps1774000000000
  implements MigrationInterface
{
  name = 'RemainingExecutiveGaps1774000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`clientes\`
        ADD \`verification_token_hash\` varchar(64) NULL,
        ADD \`verification_token_expires\` datetime NULL
    `);
    await queryRunner.query(`
      ALTER TABLE \`productos\`
        ADD \`costo_promedio\` decimal(10,2) NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE \`ordenes_compra\`
        ADD \`monto_pagado\` decimal(10,2) NOT NULL DEFAULT 0,
        ADD \`saldo_pendiente\` decimal(10,2) NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      UPDATE \`ordenes_compra\`
      SET \`saldo_pendiente\` = \`total\`
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`ordenes_compra\`
        DROP COLUMN \`saldo_pendiente\`,
        DROP COLUMN \`monto_pagado\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`productos\`
        DROP COLUMN \`costo_promedio\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`clientes\`
        DROP COLUMN \`verification_token_expires\`,
        DROP COLUMN \`verification_token_hash\`
    `);
  }
}
