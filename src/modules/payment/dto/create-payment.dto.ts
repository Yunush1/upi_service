import { IsString, IsNumber, IsUUID, IsOptional, Matches } from 'class-validator';

export class CreatePaymentDto {
  @IsNumber()
  amount!: number;

  @IsString()
  @Matches(/^[a-zA-Z0-9_.\-]{3,}@[a-zA-Z]{3,}$/, {
    message: 'Invalid UPI ID format',
  })
  receiverUpi!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  metadata?: string;
}

export class ValidateUpiDto {
  @IsString()
  @Matches(/^[a-zA-Z0-9_.\-]{3,}@[a-zA-Z]{3,}$/, {
    message: 'Invalid UPI ID format',
  })
  upiId!: string;
}

export class PaymentStatusDto {
  @IsUUID()
  transactionId!: string;
}
