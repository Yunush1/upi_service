import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionStatus, TransactionType } from '../../database/entities/transaction.entity';
import { User } from '../../database/entities/user.entity';
import { GetTransactionDto, ListTransactionsDto, TransactionDetailsDto } from './dto/transaction.dto';

@Injectable()
export class TransactionService {
  private logger = new Logger(TransactionService.name);

  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Get transaction details by ID
   */
  async getTransaction(userId: string, data: GetTransactionDto): Promise<TransactionDetailsDto> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: data.transactionId, senderId: userId },
      relations: ['sender', 'receiver'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    this.logger.log(`Transaction retrieved: ${data.transactionId}`);

    return {
      transactionId: transaction.id,
      senderId: transaction.senderId,
      receiverUpi: transaction.receiverUpi,
      amount: parseFloat(transaction.amount.toString()),
      status: transaction.status,
      type: transaction.transactionType,
      description: transaction.description,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }

  /**
   * List user's transactions with filters
   */
  async listTransactions(
    userId: string,
    data: ListTransactionsDto,
  ): Promise<{
    transactions: TransactionDetailsDto[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const limit = data.limit || 20;
    const offset = data.offset || 0;

    const query = this.transactionRepository.createQueryBuilder('t').where('t.senderId = :userId', { userId });

    if (data.status) {
      query.andWhere('t.status = :status', { status: data.status });
    }

    if (data.type) {
      query.andWhere('t.transactionType = :type', { type: data.type });
    }

    const [transactions, total] = await query
      .orderBy('t.createdAt', 'DESC')
      .limit(limit)
      .offset(offset)
      .getManyAndCount();

    this.logger.log(`Fetched ${transactions.length} transactions for user: ${userId}`);

    return {
      transactions: transactions.map((t) => ({
        transactionId: t.id,
        senderId: t.senderId,
        receiverUpi: t.receiverUpi,
        amount: parseFloat(t.amount.toString()),
        status: t.status,
        type: t.transactionType,
        description: t.description,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
      total,
      limit,
      offset,
    };
  }

  /**
   * Get transaction statistics
   */
  async getTransactionStats(userId: string): Promise<{
    totalTransactions: number;
    totalAmount: number;
    successfulTransactions: number;
    failedTransactions: number;
  }> {
    const transactions = await this.transactionRepository.find({
      where: { senderId: userId },
    });

    const totalTransactions = transactions.length;
    const totalAmount = transactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    const successfulTransactions = transactions.filter((t) => t.status === TransactionStatus.SUCCESS).length;
    const failedTransactions = transactions.filter((t) => t.status === TransactionStatus.FAILED).length;

    this.logger.log(`Transaction stats retrieved for user: ${userId}`);

    return {
      totalTransactions,
      totalAmount,
      successfulTransactions,
      failedTransactions,
    };
  }

  /**
   * Update transaction status (called by webhook/payment service)
   */
  async updateTransactionStatus(transactionId: string, status: TransactionStatus): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    transaction.status = status;
    await this.transactionRepository.save(transaction);

    this.logger.log(`Transaction ${transactionId} status updated to: ${status}`);

    return transaction;
  }
}
