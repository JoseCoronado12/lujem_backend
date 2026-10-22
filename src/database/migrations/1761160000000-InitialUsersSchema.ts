import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialUsersSchema1761160000000 implements MigrationInterface {
  name = 'InitialUsersSchema1761160000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const existingTable = await queryRunner.getTable('users');

    if (existingTable) {
      const expectedColumns: Record<string, string> = {
        id: 'int',
        email: 'varchar',
        password: 'varchar',
        fullName: 'varchar',
        isActive: 'tinyint',
        role: 'varchar',
        createdAt: 'datetime',
        updatedAt: 'datetime',
      };
      const actualColumns = new Map(
        existingTable.columns.map((column) => [column.name, column.type]),
      );
      const hasExpectedColumns =
        existingTable.columns.length === Object.keys(expectedColumns).length &&
        Object.entries(expectedColumns).every(
          ([name, type]) => actualColumns.get(name) === type,
        );
      const hasPrimaryKey = existingTable.primaryColumns.some(
        (column) => column.name === 'id',
      );
      const hasUniqueEmail = existingTable.indices.some(
        (index) =>
          index.isUnique &&
          index.columnNames.length === 1 &&
          index.columnNames[0] === 'email',
      );

      if (!hasExpectedColumns || !hasPrimaryKey || !hasUniqueEmail) {
        throw new Error(
          'The existing users table does not match the expected initial schema; refusing to baseline it.',
        );
      }

      return;
    }

    await queryRunner.query(`
      CREATE TABLE \`users\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`email\` varchar(255) NOT NULL,
        \`password\` varchar(255) NOT NULL,
        \`fullName\` varchar(255) NOT NULL,
        \`isActive\` tinyint NOT NULL DEFAULT 1,
        \`role\` varchar(255) NOT NULL DEFAULT 'user',
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_users_email\` (\`email\`)
      ) ENGINE=InnoDB
    `);
  }

  async down(): Promise<void> {
    throw new Error(
      'This initial migration cannot be reverted automatically because dropping users would destroy data.',
    );
  }
}
