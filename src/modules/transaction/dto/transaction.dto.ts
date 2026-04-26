import { IsUUID, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { TransactionStatus, TransactionType } from '../../../database/entities/transaction.entity';

export class GetTransactionDto {
  @IsUUID()
  transactionId!: string;
}

export class ListTransactionsDto {
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsNumber()
  offset?: number;
}

export class TransactionDetailsDto {
  transactionId: string;
  senderId: string;
  receiverUpi?: string;
  amount: number;
  status: TransactionStatus;
  type: TransactionType;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
