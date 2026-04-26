import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Session } from './entities/session.entity';
import { Transaction } from 'typeorm';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '12345',
  database: process.env.DB_NAME || 'payment_app',
  entities: [User, Session, Transaction, __dirname + '/entities/*.entity.{ts,js}'],
  migrations: ['dist/migrations/**/*.js'],
  migrationsTableName: 'migrations',
  synchronize: process.env.NODE_ENV !== 'production', // Auto-sync in dev only
  logging: process.env.DB_LOGGING === 'true',
  logger: 'advanced-console',
};
