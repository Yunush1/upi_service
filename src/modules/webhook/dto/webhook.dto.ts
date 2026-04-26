import { IsString, IsObject, IsOptional } from 'class-validator';

export class RazorpayWebhookDto {
  @IsString()
  id!: string;

  @IsString()
  event!: string;

  @IsObject()
  payload!: {
    payment: {
      entity: {
        id: string;
        status: string;
        amount: number;
        currency: string;
        description?: string;
        notes?: Record<string, any>;
      };
    };
  };

  @IsString()
  @IsOptional()
  signature?: string;
}

export class WebhookVerificationDto {
  @IsString()
  signature!: string;

  @IsString()
  body!: string;

  @IsString()
  secret!: string;
}
