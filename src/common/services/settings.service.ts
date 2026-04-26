import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting, SettingKey } from '../../database/entities/setting.entity';
import { CacheService } from 'src/utils/redis.service';

@Injectable()
export class SettingsService {
  private logger = new Logger(SettingsService.name);
  private cache = new Map<string, string>();

  constructor(
    @InjectRepository(Setting)
    private settingRepository: Repository<Setting>,
  ) {}

  /**
   * Get a setting by key
   */
  async getSetting(key: string): Promise<string | null> {
    // Check cache first
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const setting = await this.settingRepository.findOne({ where: { key } });

    if (!setting) {
      return null;
    }

    // Store in cache
    this.cache.set(key, setting.value);
    return setting.value;
  }

  /**
   * Get setting with type conversion
   */
  async getSettingAs<T>(key: string, defaultValue?: T): Promise<T> {
    const value = await this.getSetting(key);

    if (!value) {
      return defaultValue as T;
    }

    const setting = await this.settingRepository.findOne({ where: { key } });

    if (!setting) {
      return defaultValue as T;
    }

    try {
      switch (setting.type) {
        case 'boolean':
          return (value === 'true' || value === '1') as T;
        case 'number':
          return (parseInt(value, 10) || defaultValue) as T;
        case 'json':
          return JSON.parse(value) as T;
        default:
          return value as T;
      }
    } catch (error) {
      this.logger.error(`Error converting setting ${key}`, error);
      return defaultValue as T;
    }
  }

  /**
   * Set a setting
   */
  async setSetting(
    key: string,
    value: any,
    type: 'string' | 'number' | 'boolean' | 'json' = 'string',
    description?: string,
  ): Promise<Setting> {
    let setting = await this.settingRepository.findOne({ where: { key } });

    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

    if (setting) {
      setting.value = stringValue;
      setting.type = type;
      if (description) {
        setting.description = description;
      }
    } else {
      setting = this.settingRepository.create({
        key,
        value: stringValue,
        type,
        description,
      });
    }

    const saved = await this.settingRepository.save(setting);

    // Update cache
    this.cache.set(key, stringValue);

    this.logger.log(`Setting ${key} updated to: ${stringValue}`);

    return saved;
  }

  /**
   * Delete a setting
   */
  async deleteSetting(key: string): Promise<void> {
    await this.settingRepository.delete({ key });
    this.cache.delete(key);
    this.logger.log(`Setting ${key} deleted`);
  }

  /**
   * Get all settings
   */
  async getAllSettings(): Promise<Setting[]> {
    return this.settingRepository.find();
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.log('Settings cache cleared');
  }

  /**
   * Initialize default settings
   */
  async initializeDefaults(): Promise<void> {
    const defaults = [
      {
        key: SettingKey.PAYMENT_PROVIDER,
        value: 'RAZORPAY',
        type: 'string' as const,
        description: 'Default payment provider (RAZORPAY or CASHFREE)',
      },
      {
        key: SettingKey.OTP_EXPIRY,
        value: '300',
        type: 'number' as const,
        description: 'OTP expiry time in seconds',
      },
      {
        key: SettingKey.MAX_TRANSACTION_AMOUNT,
        value: '100000',
        type: 'number' as const,
        description: 'Maximum transaction amount in rupees',
      },
    ];

    for (const defaultSetting of defaults) {
      const exists = await this.settingRepository.findOne({
        where: { key: defaultSetting.key },
      });

      if (!exists) {
        await this.settingRepository.save(
          this.settingRepository.create(defaultSetting),
        );
        this.logger.log(`Initialized default setting: ${defaultSetting.key}`);
      }
    }
  }
}
