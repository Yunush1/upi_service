export class SendNotificationDto {
  userId!: string;
  title!: string;
  message!: string;
  type!: 'email' | 'sms' | 'push' | 'in-app';
  data?: Record<string, any>;
}

export class TransactionNotificationDto {
  transactionId!: string;
  status!: string;
  amount!: number;
  receiverUpi!: string;
}

export class PaymentNotificationDto {
  paymentId!: string;
  transactionId!: string;
  status!: string;
  provider!: string;
  amount!: number;
}
