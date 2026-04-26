import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Setting } from '../../database/entities/setting.entity';
import { SettingsService } from '../../common/services/settings.service';
import { CacheService } from 'src/utils/redis.service';

@Module({
  imports: [TypeOrmModule.forFeature([Setting])],
  controllers: [AdminController],
  providers: [AdminService, SettingsService, CacheService],
  exports: [SettingsService],
})
export class AdminModule {}
