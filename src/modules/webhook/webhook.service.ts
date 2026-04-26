import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PaymentService } from '../payment/payment.service';
import { TransactionService } from '../transaction/transaction.service';
import { RazorpayWebhookDto } from './dto/webhook.dto';
import { PaymentStatus } from '../../database/entities/payment.entity';
import { TransactionStatus } from '../../database/entities/transaction.entity';
import * as crypto from 'crypto';

@Injectable()
export class WebhookService {
  private logger = new Logger(WebhookService.name);

  constructor(
    private paymentService: PaymentService,
    private transactionService: TransactionService,
  ) {}

  /**
   * Verify Razorpay webhook signature
   */
  verifyRazorpaySignature(body: string, signature: string, secret: string): boolean {
    try {
      const hash = crypto.createHmac('sha256', secret).update(body).digest('hex');
      return hash === signature;
    } catch (error) {
      this.logger.error(`Signature verification failed: ${error}`);
      return false;
    }
  }

  /**
   * Handle Razorpay webhook
   */
  async handleRazorpayWebhook(data: RazorpayWebhookDto, signature: string): Promise<{ status: string }> {
    // Extract payment details
    const paymentId = data.payload.payment.entity.id;
    const paymentStatus = data.payload.payment.entity.status;

    this.logger.log(`Received webhook for payment: ${paymentId}, Status: ${paymentStatus}`);

    // Map Razorpay status to internal status
    let internalStatus: PaymentStatus;
    let transactionStatus: TransactionStatus;

    switch (paymentStatus) {
      case 'authorized':
        internalStatus = PaymentStatus.AUTHORIZED;
        transactionStatus = TransactionStatus.PENDING;
        break;
      case 'captured':
        internalStatus = PaymentStatus.CAPTURED;
        transactionStatus = TransactionStatus.SUCCESS;
        break;
      case 'failed':
        internalStatus = PaymentStatus.FAILED;
        transactionStatus = TransactionStatus.FAILED;
        break;
      case 'refunded':
        internalStatus = PaymentStatus.REFUNDED;
        transactionStatus = TransactionStatus.CANCELLED;
        break;
      default:
        throw new BadRequestException(`Unknown payment status: ${paymentStatus}`);
    }

    // Extract transaction ID from notes (if available)
    const notes = data.payload.payment.entity.notes || {};
    const transactionId = notes.transaction_id;

    if (!transactionId) {
      this.logger.warn(`No transaction ID found in webhook for payment: ${paymentId}`);
      return { status: 'processed' };
    }

    // Update payment and transaction status
    try {
      await this.paymentService.updatePaymentStatus(transactionId, internalStatus, paymentId);
      await this.transactionService.updateTransactionStatus(transactionId, transactionStatus);

      this.logger.log(`Webhook processed successfully for transaction: ${transactionId}`);
    } catch (error) {
      this.logger.error(`Error processing webhook for transaction: ${transactionId}`, error);
      throw error;
    }

    return { status: 'processed' };
  }

  /**
   * Handle payment gateway webhook (generic)
   */
  async handlePaymentWebhook(
    event: string,
    payload: Record<string, any>,
  ): Promise<{ status: string }> {
    this.logger.log(`Processing webhook event: ${event}`);

    // Handle different event types
    switch (event) {
      case 'payment.authorized':
        return { status: 'processed' };
      case 'payment.captured':
        // Update payment status to captured
        return { status: 'processed' };
      case 'payment.failed':
        // Update payment status to failed
        return { status: 'processed' };
      default:
        this.logger.warn(`Unknown webhook event: ${event}`);
        return { status: 'ignored' };
    }
  }
}
