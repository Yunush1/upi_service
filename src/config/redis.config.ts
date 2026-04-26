import Redis, { RedisOptions } from 'ioredis';
import { Logger } from '@nestjs/common';
/**
 * Redis configuration loaded from environment variables
 */
const logger = new Logger('RedisConfig');
const redisConfig: RedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  
  // Connection settings
  connectTimeout: 10000,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,
  
  // Retry strategy
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    logger.log(`🔄 Redis reconnecting (attempt ${times})...`);
    return delay;
  },

  // Reconnect strategy
  reconnectOnError: (err: Error) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true; // Only reconnect if error contains READONLY
    }
    return false;
  },
};

/**
 * Redis client instance
 */
export const redis = new Redis(redisConfig);

/**
 * Connection event handlers
 */
redis.on('connect', () => {
  logger.log('✅ Redis connected successfully');
});

redis.on('ready', () => {
  logger.log('✅ Redis ready for commands');
});

redis.on('error', (err: Error) => {
  logger.error('❌ Redis error:', err.message);
});

redis.on('reconnecting', () => {
  logger.log('🔄 Redis reconnecting...');
});

redis.on('close', () => {
  logger.error('🔴 Redis connection closed');
});

/**
 * Graceful shutdown handler
 */
process.on('SIGINT', async () => {
  logger.warn('\n📤 Closing Redis connection...');
  await redis.quit();
  logger.log('✅ Redis connection closed gracefully');
  process.exit(0);
});

/**
 * Health check function
 */
export async function checkRedisHealth(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}