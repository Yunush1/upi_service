import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentProvider, PaymentStatus } from '../../database/entities/payment.entity';
import { Transaction, TransactionStatus, TransactionType } from '../../database/entities/transaction.entity';
import { User } from '../../database/entities/user.entity';
import { CreatePaymentDto, ValidateUpiDto, PaymentStatusDto } from './dto/create-payment.dto';
import { SettingsService } from '../../common/services/settings.service';
import { SettingKey } from '../../database/entities/setting.entity';

@Injectable()
export class PaymentService {
  private logger = new Logger(PaymentService.name);
  private configuredProvider: PaymentProvider = PaymentProvider.RAZORPAY;

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private settingsService: SettingsService,
  ) {
    this.initializeProvider();
  }

  /**
   * Initialize provider from settings
   */
  private async initializeProvider(): Promise<void> {
    try {
      const provider = await this.settingsService.getSetting(SettingKey.PAYMENT_PROVIDER);
      if (provider === 'CASHFREE' || provider === 'RAZORPAY') {
        this.configuredProvider = provider as PaymentProvider;
        this.logger.log(`Payment provider initialized: ${this.configuredProvider}`);
      }
    } catch (error) {
      this.logger.warn(`Failed to load payment provider, using default: ${PaymentProvider.RAZORPAY}`);
    }
  }

  /**
   * Validate UPI ID format
   */
  async validateUpi(data: ValidateUpiDto): Promise<{ isValid: boolean }> {
    const upiRegex = /^[a-zA-Z0-9_.\-]{3,}@[a-zA-Z]{3,}$/;
    const isValid = upiRegex.test(data.upiId);

    if (!isValid) {
      throw new BadRequestException('Invalid UPI ID format');
    }

    this.logger.log(`UPI validation successful for: ${data.upiId}`);
    return { isValid: true };
  }

  /**
   * Create payment request
   * Flow: User initiates payment → Creates transaction → Creates payment record
   */
  async createPayment(
    userId: string,
    data: CreatePaymentDto,
  ): Promise<{
    transactionId: string;
    paymentId: string;
    provider: string;
    status: string;
    amount: number;
    providerPaymentId: string;
  }> {
    // Validate UPI
    const upiValidation = await this.validateUpi({ upiId: data.receiverUpi });
    if (!upiValidation.isValid) {
      throw new BadRequestException('Invalid receiver UPI ID');
    }

    // Verify user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate amount
    if (data.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }
    this.logger.log(`Creating payment of amount ${JSON.stringify({userId,amount: data.amount, receiverUpi: data.receiverUpi,
        status: TransactionStatus.PENDING,
        type: TransactionType.SEND,
        description: data.description,
        metadata: data.metadata ? JSON.parse(data.metadata) : null,
        transactionType: TransactionType.SEND,
    })}`);
    // Create transaction
    const transaction = await this.transactionRepository.save({
      senderId: userId,
      receiverUpi: data.receiverUpi,
      amount: data.amount,
      status: TransactionStatus.PENDING,
      transactionType: TransactionType.SEND,
      description: data.description,
      metadata: data.metadata ? JSON.parse(data.metadata) : null,
    });

    this.logger.log(`Transaction created: ${transaction.id} for user: ${userId}`);

    // Create payment record (with Razorpay as default provider)
    const payment = await this.paymentRepository.save({
      userId,
      transactionId: transaction.id,
      provider: PaymentProvider.RAZORPAY,
      providerPaymentId: `razorpay_${transaction.id}`,
      status: PaymentStatus.CREATED,
      amount: data.amount,
      currency: 'INR',
      metadata: {
        upiId: data.receiverUpi,
        timestamp: new Date().toISOString(),
      },
    });

    this.logger.log(`Payment created: ${payment.id} for transaction: ${transaction.id}`);

    return {
      transactionId: transaction.id,
      paymentId: payment.id,
      provider: payment.provider,
      status: payment.status,
      amount: payment.amount,
      providerPaymentId: payment.providerPaymentId,
    };
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(
    userId: string,
    data: PaymentStatusDto,
  ): Promise<{
    transactionId: string;
    status: string;
    amount: number;
    provider: string;
    providerPaymentId: string;
  }> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: data.transactionId, senderId: userId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const payment = await this.paymentRepository.findOne({
      where: { transactionId: data.transactionId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    this.logger.log(`Payment status retrieved for transaction: ${data.transactionId}`);

    return {
      transactionId: transaction.id,
      status: payment.status,
      amount: payment.amount,
      provider: payment.provider,
      providerPaymentId: payment.providerPaymentId,
    };
  }

  /**
   * Update payment status (called by webhook)
   */
  async updatePaymentStatus(
    transactionId: string,
    status: PaymentStatus,
    providerPaymentId: string,
  ): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { transactionId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    payment.status = status;
    payment.providerPaymentId = providerPaymentId;

    if (status === PaymentStatus.CAPTURED) {
      payment.capturedAt = new Date();
    }

    if (status === PaymentStatus.FAILED) {
      payment.failedAt = new Date();
    }

    await this.paymentRepository.save(payment);
    this.logger.log(`Payment ${payment.id} status updated to: ${status}`);

    return payment;
  }

  /**
   * Get user's payments
   */
  async getUserPayments(
    userId: string,
    limit = 10,
    offset = 0,
  ): Promise<{ payments: Payment[]; total: number }> {
    const [payments, total] = await this.paymentRepository.findAndCount({
      where: { userId },
      relations: ['transaction', 'user'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { payments, total };
  }
}
