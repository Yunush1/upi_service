import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService {
    private readonly logger = new Logger('DatabaseService');

    constructor(private dataSource: DataSource) { }

    async checkConnection(): Promise<boolean> {
        try {
            await this.dataSource.query('SELECT 1');
            this.logger.log('✅ Database connected successfully');
            return true;
        } catch (error: any) {
            this.logger.error('❌ Database connection failed:', error?.message);
            return false;
        }
    }

    isConnected(): boolean {
        return this.dataSource.isInitialized;
    }

    async getConnectionStatus() {
        const options = this.dataSource.options as any;
        return {
            isConnected: this.isConnected(),
            database: options.database,
            host: options.host,
        };
    }
}