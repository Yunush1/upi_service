import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SettingsService } from '../../common/services/settings.service';
import { UpdatePaymentProviderDto, UpdateSettingDto, PaymentProviderOption, SettingResponseDto } from './dto/setting.dto';
import { SettingKey } from '../../database/entities/setting.entity';
import { CacheService } from 'src/utils/redis.service';

@Injectable()
export class AdminService {
    private logger = new Logger(AdminService.name);

    constructor(
        private settingsService: SettingsService,
        private cacheService: CacheService
    ) { }

    /**
     * Get current payment provider configuration
     */
    async getPaymentProvider(): Promise<{
        provider: string;
        description: string;
    }> {
        const cachedProvider = await this.cacheService.get('payment_provider');
        if (cachedProvider) {
            this.logger.log('Payment provider fetched from cache');
            return {
                provider: cachedProvider,
                description: `Current active payment provider is ${cachedProvider} (cached)`,
            };
        }
        const provider = await this.settingsService.getSetting(SettingKey.PAYMENT_PROVIDER);
        await this.cacheService.set('payment_provider', provider || 'RAZORPAY', 3600); // Cache for 1 hour
        return {
            provider: provider || 'RAZORPAY',
            description: `Current active payment provider is ${provider || 'RAZORPAY'}`,
        };
    }

    /**
     * Update payment provider
     */
    async updatePaymentProvider(data: UpdatePaymentProviderDto): Promise<{
        success: boolean;
        message: string;
        provider: string;
    }> {
        // Validate provider
        if (!Object.values(PaymentProviderOption).includes(data.provider)) {
            throw new BadRequestException(`Invalid provider. Must be ${Object.values(PaymentProviderOption).join(' or ')}`);
        }

        // Update provider setting
        await this.settingsService.setSetting(
            SettingKey.PAYMENT_PROVIDER,
            data.provider,
            'string',
            `Active payment provider: ${data.provider}`,
        );

        // Store API credentials if provided
        if (data.apiKey) {
            const keySettingKey = data.provider === 'RAZORPAY'
                ? SettingKey.RAZORPAY_KEY
                : SettingKey.CASHFREE_KEY;

            await this.settingsService.setSetting(
                keySettingKey,
                data.apiKey,
                'string',
                `${data.provider} API Key`,
            );
        }

        if (data.apiSecret) {
            const secretSettingKey = data.provider === 'RAZORPAY'
                ? SettingKey.RAZORPAY_SECRET
                : SettingKey.CASHFREE_SECRET;

            await this.settingsService.setSetting(
                secretSettingKey,
                data.apiSecret,
                'string',
                `${data.provider} API Secret`,
            );
        }
        
        this.logger.log(`Payment provider updated to: ${data.provider}`);
        await this.cacheService.set('payment_provider', data.provider, 3600); // Cache for 1 hour

        return {
            success: true,
            message: `Payment provider successfully updated to ${data.provider}`,
            provider: data.provider,
        };
    }

    /**
     * Get all settings
     */
    async getAllSettings(): Promise<SettingResponseDto[]> {
        const settings = await this.settingsService.getAllSettings();

        const map = new Map<string, string>(
            settings.map((s) => [s.key, s.value]),
        );
        console.log('Settings map:', settings);

        const provider =
            map.get(SettingKey.PAYMENT_PROVIDER) || 'RAZORPAY';

        let apiKey: string | undefined;
        let apiSecret: string | undefined;

        if (provider === 'RAZORPAY') {
            apiKey = map.get(SettingKey.RAZORPAY_KEY) || undefined;
            apiSecret = map.get(SettingKey.RAZORPAY_SECRET) || undefined;
        } else if (provider === 'CASHFREE') {
            apiKey = map.get(SettingKey.CASHFREE_KEY) || undefined;
            apiSecret = map.get(SettingKey.CASHFREE_SECRET) || undefined;
        }

        return [
            {
                key: 'provider',
                value: provider,
            },
            {
                key: 'apiKey',
                value: apiKey,
            },
            {
                key: 'apiSecret',
                value: apiSecret,
            },
        ];
    }
    /**
     * Get a specific setting
     */
    async getSetting(key: string) {
        const settings = await this.settingsService.getAllSettings();
        const setting = settings.find((s) => s.key === key);

        if (!setting) {
            throw new BadRequestException(`Setting with key ${key} not found`);
        }

        return {
            id: setting.id,
            key: setting.key,
            value: setting.value,
            description: setting.description,
            type: setting.type,
            createdAt: setting.createdAt,
            updatedAt: setting.updatedAt,
        };
    }

    /**
     * Update a specific setting
     */
    async updateSetting(key: string, data: UpdateSettingDto) {
        const type = (data.type || 'string') as 'string' | 'number' | 'boolean' | 'json';

        await this.settingsService.setSetting(key, data.value, type, data.description);

        return {
            success: true,
            message: `Setting ${key} updated successfully`,
            key,
            value: data.value,
        };
    }

    /**
     * Delete a specific setting
     */
    async deleteSetting(key: string) {
        await this.settingsService.deleteSetting(key);

        this.logger.log(`Setting ${key} deleted`);

        return {
            success: true,
            message: `Setting ${key} deleted successfully`,
        };
    }

    /**
     * Initialize default settings
     */
    async initializeDefaultSettings() {
        await this.settingsService.initializeDefaults();

        this.logger.log('Default settings initialized');

        return {
            success: true,
            message: 'Default settings initialized successfully',
        };
    }
}
