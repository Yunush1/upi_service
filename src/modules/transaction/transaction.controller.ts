import { Controller, Get, Post, Body, UseGuards, Request, Query } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { GetTransactionDto, ListTransactionsDto } from './dto/transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('transaction')
@UseGuards(JwtAuthGuard)
export class TransactionController {
  constructor(private transactionService: TransactionService) {}

  /**
   * GET /transaction/:id
   * Get transaction details
   */
  @Post('/:id')
  async getTransaction(@Body() data: GetTransactionDto, @Request() req: any) {
    const userId = req.user.id;
    return this.transactionService.getTransaction(userId, data);
  }

  /**
   * GET /transaction/list
   * List user's transactions with pagination and filters
   */
  @Get('/list')
  async listTransactions(@Request() req: any, @Query() query: ListTransactionsDto) {
    const userId = req.user.id;
    return this.transactionService.listTransactions(userId, {
      status: query.status,
      type: query.type,
      limit: query.limit,
      offset: query.offset,
    });
  }

  /**
   * GET /transaction/stats
   * Get transaction statistics
   */
  @Get('/stats')
  async getStats(@Request() req: any) {
    const userId = req.user.id;
    return this.transactionService.getTransactionStats(userId);
  }
}
