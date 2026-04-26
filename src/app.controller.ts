import { Controller, Get, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
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

  // ==================== TEST DASHBOARD ====================
  @Get('dashboard')
  getDashboard(@Res() res: Response) {
    try {
      const filePath = join(__dirname, '..', '/public/test-dashboard.html');
      const htmlContent = readFileSync(filePath, 'utf-8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(htmlContent);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(404).json({
        message: 'Dashboard not found',
        error: errorMessage,
        hint: 'Make sure test-dashboard.html exists in the project root',
      });
    }
  }

  @Get('test')
  getTestInfo() {
    return {
      message: '🧪 UPI Payment System - Testing Endpoints',
      endpoints: {
        dashboard: 'GET /dashboard - Interactive Testing Dashboard (HTML)',
        health: 'GET /health - Health Check',
        api_docs: 'GET /api - Swagger API Documentation',
      },
      quick_start: {
        step1: 'Open http://localhost:3000/dashboard in your browser',
        step2: 'Test login with phone: 9876543210',
        step3: 'Create payments and check transactions',
        admin: 'Use phone 9999999999 to access admin settings',
      },
    };
  }
}
