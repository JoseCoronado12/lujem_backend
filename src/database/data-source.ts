import 'dotenv/config';
import { DataSource } from 'typeorm';

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export default new DataSource({
  type: 'mysql',
  host: getRequiredEnv('DB_HOST'),
  port: Number(getRequiredEnv('DB_PORT')),
  username: getRequiredEnv('DB_USERNAME'),
  password: process.env.DB_PASSWORD ?? '',
  database: getRequiredEnv('DB_DATABASE'),
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
});
