import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './database.config';
import { User } from './entities/user.entity';
import { Session } from './entities/session.entity';
import { Transaction } from './entities/transaction.entity';
import { Payment } from './entities/payment.entity';
import { DatabaseService } from './database.service';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([User, Session, Transaction, Payment]),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService, TypeOrmModule],
})
export class DatabaseModule {}
