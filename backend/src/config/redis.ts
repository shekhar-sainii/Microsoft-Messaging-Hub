import Redis from 'ioredis';
import { config } from './index';

export const redisConfig: any = {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    tls: config.redis.password || config.redis.host.includes('upstash') || config.redis.host.includes('render') ? { rejectUnauthorized: false } : undefined,
    maxRetriesPerRequest: null,
    retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
};

// Remove undefined keys for clean local init if no password exists
if (!redisConfig.password) delete redisConfig.password;
if (!redisConfig.tls) delete redisConfig.tls;

export const redis = config.redis.url 
    ? new Redis(config.redis.url, { 
        tls: config.redis.url.startsWith('rediss://') || config.redis.url.includes('upstash') ? { rejectUnauthorized: false } : undefined,
        maxRetriesPerRequest: null 
      }) 
    : new Redis(redisConfig);

redis.on('connect', () => {
    console.log('✅ Redis Connected Successfully');
});

redis.on('error', (err) => {
    console.error('❌ Redis Error:', err.message || err);
});

// For BullMQ queue initializers
export const redisConnection = config.redis.url 
    ? new Redis(config.redis.url, { 
        tls: config.redis.url.startsWith('rediss://') || config.redis.url.includes('upstash') ? { rejectUnauthorized: false } : undefined,
        maxRetriesPerRequest: null 
      }) 
    : redisConfig;
