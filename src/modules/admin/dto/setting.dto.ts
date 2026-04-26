import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';

export enum PaymentProviderOption {
  RAZORPAY = 'RAZORPAY',
  CASHFREE = 'CASHFREE',
}

export class UpdatePaymentProviderDto {
  @IsEnum(PaymentProviderOption)
  provider!: PaymentProviderOption;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsString()
  apiSecret?: string;
}

export class GetPaymentProviderDto {
  provider?: string;
  key?: string;
  value?: string;
}

export class UpdateSettingDto {
  @IsString()
  key!: string;

  @IsString()
  value!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  type?: 'string' | 'number' | 'boolean' | 'json';
}

export class SettingResponseDto {
  id?: string;
  key?: string;
  value?: string;
  provider?: string;
  description?: string;
  type?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
