import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { UpdatePaymentProviderDto, UpdateSettingDto, SettingResponseDto } from './dto/setting.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/role-auth.guard';
import { Roles } from '../auth/guards/role-decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')   
export class AdminController {
  private logger = new Logger(AdminController.name);

  constructor(private adminService: AdminService) {}

  /**
   * GET /admin/payment-provider
   * Get current payment provider configuration
   */
  @Get('/payment-provider')
  async getPaymentProvider() {
    this.logger.log('Fetching current payment provider');
    return this.adminService.getPaymentProvider();
  }

  /**
   * PUT /admin/payment-provider
   * Update payment provider (Razorpay or Cashfree)
   */
  @Put('/payment-provider')
  @HttpCode(HttpStatus.OK)
  async updatePaymentProvider(@Body() data: UpdatePaymentProviderDto) {
    this.logger.log(`Updating payment provider to: ${data.provider}`);
    return this.adminService.updatePaymentProvider(data);
  }

  /**
   * GET /admin/settings
   * Get all settings
   */
  @Get('/settings')
  async getAllSettings(): Promise<SettingResponseDto[]> {
    this.logger.log('Fetching all settings');
    return this.adminService.getAllSettings();
  }

  /**
   * GET /admin/settings/:key
   * Get a specific setting
   */
  @Get('/settings/:key')
  async getSetting(@Param('key') key: string) {
    this.logger.log(`Fetching setting: ${key}`);
    return this.adminService.getSetting(key);
  }

  /**
   * PUT /admin/settings/:key
   * Update a specific setting
   */
  @Put('/settings/:key')
  @HttpCode(HttpStatus.OK)
  async updateSetting(@Param('key') key: string, @Body() data: UpdateSettingDto) {
    this.logger.log(`Updating setting: ${key}`);
    return this.adminService.updateSetting(key, data);
  }

  /**
   * DELETE /admin/settings/:key
   * Delete a specific setting
   */
  @Delete('/settings/:key')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSetting(@Param('key') key: string) {
    this.logger.log(`Deleting setting: ${key}`);
    return this.adminService.deleteSetting(key);
  }

  /**
   * POST /admin/settings/initialize
   * Initialize default settings
   */
  @Post('/settings/initialize')
  @HttpCode(HttpStatus.OK)
  async initializeSettings() {
    this.logger.log('Initializing default settings');
    return this.adminService.initializeDefaultSettings();
  }
}
