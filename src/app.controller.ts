import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { DatabaseService } from './database/database.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService,
    private readonly dbService: DatabaseService,
  ) { }

  @Get("")
  getHello(): string {
    return this.appService.getHello();
  }

  @Post()
  addHello(): string {
    return this.appService.addHello();
  }
  @Get('health')
  async health() {
    const dbConnected = await this.dbService.checkConnection();
    return {
      status: 'ok',
      database: dbConnected ? 'connected' : 'disconnected',
    };
  }

  @Get('db-status')
  async dbStatus() {
    return this.dbService.getConnectionStatus();
  }
}
