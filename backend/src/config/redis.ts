import Redis from 'ioredis';
import { config } from './index';

export const redisConfig = {
    host: config.redis.host,
    port: config.redis.port,
    retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
};

export const redis = new Redis(redisConfig);

redis.on('connect', () => {
    console.log('✅ Redis Connected Successfully');
});

redis.on('error', (err) => {
    console.error('❌ Redis Error:', err);
});

// For BullMQ and other services that need a raw connection object
export const redisConnection = {
    host: config.redis.host,
    port: config.redis.port,
};
