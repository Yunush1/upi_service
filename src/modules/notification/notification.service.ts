import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { SendNotificationDto, TransactionNotificationDto, PaymentNotificationDto } from './dto/notification.dto';

@Injectable()
export class NotificationService {
  private logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Send notification to user
   * Can support multiple channels: email, SMS, push notification, in-app
   */
  async sendNotification(data: SendNotificationDto): Promise<{ success: boolean }> {
    const user = await this.userRepository.findOne({ where: { id: data.userId } });

    if (!user) {
      this.logger.warn(`User not found: ${data.userId}`);
      return { success: false };
    }

    this.logger.log(`Sending ${data.type} notification to ${data.userId}`);

    // Route notification based on type
    switch (data.type) {
      case 'email':
        await this.sendEmailNotification(user.email, data);
        break;
      case 'sms':
        await this.sendSmsNotification(user.phone!, data);
        break;
      case 'push':
        await this.sendPushNotification(data.userId, data);
        break;
      case 'in-app':
        await this.saveInAppNotification(data.userId, data);
        break;
      default:
        this.logger.warn(`Unknown notification type: ${data.type}`);
    }

    return { success: true };
  }

  /**
   * Send transaction status notification
   */
  async notifyTransactionStatus(
    userId: string,
    data: TransactionNotificationDto,
  ): Promise<{ success: boolean }> {
    const statusMessages: Record<string, string> = {
      PENDING: 'Your transaction is being processed',
      SUCCESS: 'Transaction completed successfully',
      FAILED: 'Transaction failed. Please try again',
      CANCELLED: 'Transaction has been cancelled',
    };

    const message = statusMessages[data.status] || 'Transaction status updated';

    return this.sendNotification({
      userId,
      title: `Transaction ${data.status.toLowerCase()}`,
      message: `${message}. Amount: ₹${data.amount} to ${data.receiverUpi}`,
      type: 'push',
      data: {
        transactionId: data.transactionId,
        status: data.status,
        amount: data.amount,
      },
    });
  }

  /**
   * Send payment status notification
   */
  async notifyPaymentStatus(
    userId: string,
    data: PaymentNotificationDto,
  ): Promise<{ success: boolean }> {
    const statusMessages: Record<string, string> = {
      CREATED: 'Payment initiated',
      INITIATED: 'Payment is being processed',
      AUTHORIZED: 'Payment authorized',
      CAPTURED: 'Payment captured successfully',
      FAILED: 'Payment failed',
      CANCELLED: 'Payment cancelled',
      REFUNDED: 'Payment refunded',
    };

    const message = statusMessages[data.status] || 'Payment status updated';

    return this.sendNotification({
      userId,
      title: `Payment ${data.status.toLowerCase()}`,
      message: `${message}. Amount: ₹${data.amount} via ${data.provider}`,
      type: 'sms',
      data: {
        paymentId: data.paymentId,
        transactionId: data.transactionId,
        status: data.status,
      },
    });
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(email: string | undefined, data: SendNotificationDto): Promise<void> {
    if (!email) {
      this.logger.warn(`No email found for user: ${data.userId}`);
      return;
    }

    // TODO: Integrate with email service (e.g., SendGrid, AWS SES)
    this.logger.log(`Email would be sent to: ${email}`);
    this.logger.log(`Subject: ${data.title}`);
    this.logger.log(`Message: ${data.message}`);
  }

  /**
   * Send SMS notification
   */
  private async sendSmsNotification(phone: string, data: SendNotificationDto): Promise<void> {
    // TODO: Integrate with SMS service (e.g., Twilio, AWS SNS)
    this.logger.log(`SMS would be sent to: ${phone}`);
    this.logger.log(`Message: ${data.title} - ${data.message}`);
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(userId: string, data: SendNotificationDto): Promise<void> {
    // TODO: Integrate with push notification service (e.g., Firebase Cloud Messaging)
    this.logger.log(`Push notification would be sent to user: ${userId}`);
    this.logger.log(`Title: ${data.title}`);
    this.logger.log(`Message: ${data.message}`);
  }

  /**
   * Save in-app notification
   */
  private async saveInAppNotification(userId: string, data: SendNotificationDto): Promise<void> {
    // TODO: Create notification record in database for in-app display
    this.logger.log(`In-app notification saved for user: ${userId}`);
    this.logger.log(`Title: ${data.title}`);
    this.logger.log(`Message: ${data.message}`);
  }
}
