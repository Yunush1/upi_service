import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('signup-email')
  signupWithEmail(@Body() dto: any) {
    return this.authService.signupWithEmail(dto);
  }

  @Post('login-email')
  loginWithEmail(@Body() dto: any) {
    console.log(`Login attempt with identifier: ${JSON.stringify(dto)}`);
    return this.authService.loginWithPassword(dto.identifier, dto.password);
  }

  @Post('logout')
  logout(@Body() dto: any) {
    return this.authService.logout(dto.identifier);
  }
}