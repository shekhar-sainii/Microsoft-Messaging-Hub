import { redis } from '../config/redis';
import { logger } from './logger';

/**
 * Token-bucket rate limiter implemented with Redis.
 * Ensures we don't exceed Microsoft Graph API limits (e.g., 3 requests / second).
 */
export class RateLimiter {
    /**
     * Attempts to acquire a token for the given key.
     * @param key Unique identifier (e.g., tenantId or userId)
     * @param limit Max tokens in bucket
     * @param interval Interval in seconds to refill the bucket
     */
    static async acquire(key: string, limit: number = 3, interval: number = 1): Promise<boolean> {
        const fullKey = `ratelimit:${key}`;
        
        try {
            // Using a Lua script for atomic token-bucket check
            const script = `
                local current = redis.call('get', KEYS[1])
                if not current then
                    redis.call('set', KEYS[1], ARGV[1] - 1, 'EX', ARGV[2])
                    return 1
                end
                if tonumber(current) > 0 then
                    redis.call('decr', KEYS[1])
                    return 1
                else
                    return 0
                end
            `;

            const result = await (redis as any).eval(script, 1, fullKey, limit, interval);
            return result === 1;
        } catch (err) {
            logger.error('RateLimiter error', err);
            return true; // Fail open to avoid blocking valid traffic if Redis is down
        }
    }

    /**
     * Middleware-style wrapper for Graph API calls.
     * Retries if throttled or returns a standard 429-aware response.
     */
    static async throttle(key: string, fn: () => Promise<any>): Promise<any> {
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
            const hasToken = await this.acquire(key);
            if (hasToken) {
                try {
                    return await fn();
                } catch (error: any) {
                    if (error.status === 429 || error.statusCode === 429) {
                        const retryAfter = parseInt(error.response?.headers?.['retry-after'] || '1', 10);
                        logger.warn(`Graph API throttled. Retrying in ${retryAfter}s...`);
                        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                        attempts++;
                        continue;
                    }
                    throw error;
                }
            } else {
                // Wait 500ms before trying to acquire token again
                await new Promise(resolve => setTimeout(resolve, 500));
                attempts++;
            }
        }
        throw new Error('Rate limit exceeded after multiple retries');
    }
}
