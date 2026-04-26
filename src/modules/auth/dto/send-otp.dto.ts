import { IsNotEmpty, IsPhoneNumber } from 'class-validator';

export class SendOtpDto {
  @IsPhoneNumber('IN')
  phone!: string;
}