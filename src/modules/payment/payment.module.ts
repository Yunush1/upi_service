import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { Payment } from '../../database/entities/payment.entity';
import { Transaction } from '../../database/entities/transaction.entity';
import { User } from '../../database/entities/user.entity';
import { Setting } from '../../database/entities/setting.entity';
import { SettingsService } from '../../common/services/settings.service';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Transaction, User, Setting])],
  controllers: [PaymentController],
  providers: [PaymentService, SettingsService],
  exports: [PaymentService, SettingsService],
})
export class PaymentModule {}
