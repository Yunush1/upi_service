import { Controller, Post, Body, Headers, BadRequestException, Req, Logger } from '@nestjs/common';
import { Request } from 'express';
import type { RawBodyRequest } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { RazorpayWebhookDto } from './dto/webhook.dto';

@Controller('webhook')
export class WebhookController {
    logger = new Logger(WebhookController.name);
    constructor(private webhookService: WebhookService) { }

    /**
     * POST /webhook/razorpay
     * Receive payment updates from Razorpay
     */
    @Post('/razorpay')
    async handleRazorpayWebhook(
        @Req() req: RawBodyRequest<Request>,
        @Headers('x-razorpay-signature') signature: string,
        @Body() data: RazorpayWebhookDto,
    ) {
        console.log(`Received Razorpay webhook: ${JSON.stringify(data)}`);
        this.logger.debug(`Received Razorpay webhook: ${JSON.stringify(data)}`);
        // Get raw body for signature verification
        const body = req.rawBody || JSON.stringify(data);
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_secret';

        // Verify signature
        const isValid = this.webhookService.verifyRazorpaySignature(body as string, signature, secret);
        if (!isValid) {
            throw new BadRequestException('Invalid webhook signature');
        }

        // Process webhook
        return this.webhookService.handleRazorpayWebhook(data, signature);
    }

    /**
     * POST /webhook/cashfree
     * Receive payment updates from Cashfree
     */
    @Post('/cashfree')
    async handleCashfreeWebhook(@Body() data: Record<string, any>) {
        // Implement Cashfree webhook handling
        console.log(`Received Cashfree webhook: ${JSON.stringify(data)}`);
        // return this.webhookService.handlePaymentWebhook(data.event || 'cashfree_event', data);
        return { status: 'processed' };
    }

    /**
     * POST /webhook/generic
     * Generic webhook endpoint for testing
     */
    @Post('/generic')
    async handleGenericWebhook(@Body() data: Record<string, any>) {
        const event = data.event || 'unknown';
        return this.webhookService.handlePaymentWebhook(event, data.payload || {});
    }
}
