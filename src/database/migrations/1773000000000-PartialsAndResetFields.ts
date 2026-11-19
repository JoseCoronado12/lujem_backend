import { MigrationInterface, QueryRunner } from 'typeorm';

export class PartialsAndResetFields1773000000000
  implements MigrationInterface
{
  name = 'PartialsAndResetFields1773000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`ordenes_compra\`
        MODIFY \`estado\`
        enum('BORRADOR','ENVIADA','PARCIAL','RECIBIDA','CANCELADA','DEVUELTA')
        NOT NULL DEFAULT 'BORRADOR'
    `);
    await queryRunner.query(`
      ALTER TABLE \`detalles_orden_compra\`
        ADD \`cantidad_recibida\` int NOT NULL DEFAULT 0
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`detalles_orden_compra\`
        DROP COLUMN \`cantidad_recibida\`
    `);
    await queryRunner.query(`
      ALTER TABLE \`ordenes_compra\`
        MODIFY \`estado\`
        enum('BORRADOR','ENVIADA','RECIBIDA','CANCELADA')
        NOT NULL DEFAULT 'BORRADOR'
    `);
  }
}
