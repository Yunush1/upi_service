import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum SettingKey {
  PAYMENT_PROVIDER = 'payment_provider',
  RAZORPAY_KEY = 'razorpay_key',
  RAZORPAY_SECRET = 'razorpay_secret',
  CASHFREE_KEY = 'cashfree_key',
  CASHFREE_SECRET = 'cashfree_secret',
  OTP_EXPIRY = 'otp_expiry',
  MAX_TRANSACTION_AMOUNT = 'max_transaction_amount',
}

@Entity('settings')
@Index(['key'], { unique: true })
export class Setting {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  key!: string;

  @Column({ type: 'text' })
  value!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 50, default: 'string' })
  type!: 'string' | 'number' | 'boolean' | 'json';

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
