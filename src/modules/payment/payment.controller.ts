import { Controller, Post, Get, Body, UseGuards, Request, Query } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto, ValidateUpiDto, PaymentStatusDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payment')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  /**
   * POST /payment/validate-upi
   * Validate UPI ID format
   */
  @Post('/validate-upi')
  async validateUpi(@Body() data: ValidateUpiDto) {
    return this.paymentService.validateUpi(data);
  }

  /**
   * POST /payment/create
   * Create a new payment request
   */
  @Post('/create')
  async createPayment(@Body() data: CreatePaymentDto, @Request() req: any) {
    const userId = req.user.id;
    return this.paymentService.createPayment(userId, data);
  }

  /**
   * POST /payment/status
   * Get payment status
   */
  @Post('/status')
  async getPaymentStatus(@Body() data: PaymentStatusDto, @Request() req: any) {
    const userId = req.user.id;
    console.log(`Getting payment status for user: ${JSON.stringify(req.user)} and paymentId: ${JSON.stringify(data)}`);
    return this.paymentService.getPaymentStatus(userId, data);
  }

  /**
   * GET /payment/list
   * Get user's payment history
   */
  @Get('/list')
  async getUserPayments(
    @Request() req: any,
    @Query('limit') limit :number= 10,
    @Query('offset') offset: number = 0,
  ) {
    const userId = req.user.id || req.user.phone;
    return this.paymentService.getUserPayments(userId, limit, offset);
  }
}
