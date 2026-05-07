import { redis } from '../config/redis';

/**
 * Redis-based Token Bucket Rate Limiter
 * Implements the token-bucket algorithm for smooth, burst-tolerant throttling.
 * Each key has a bucket of tokens that refills at a fixed rate.
 */
export class RateLimiter {
    /**
     * Checks if a request should be allowed using token-bucket algorithm.
     * @param key       Unique key for the requester (e.g., userId or IP)
     * @param capacity  Max tokens in the bucket (burst limit)
     * @param refillRate Tokens added per second
     */
    static async isAllowed(key: string, capacity: number, refillRate: number): Promise<boolean> {
        const now = Date.now();
        const bucketKey = `tokenbucket:${key}`;

        // Lua script for atomic token-bucket check-and-consume
        const luaScript = `
            local key = KEYS[1]
            local capacity = tonumber(ARGV[1])
            local refill_rate = tonumber(ARGV[2])
            local now = tonumber(ARGV[3])

            local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
            local tokens = tonumber(bucket[1])
            local last_refill = tonumber(bucket[2])

            -- First request: initialise bucket
            if tokens == nil then
                tokens = capacity - 1
                redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
                redis.call('EXPIRE', key, math.ceil(capacity / refill_rate) + 60)
                return 1
            end

            -- Refill tokens based on elapsed time
            local elapsed = (now - last_refill) / 1000
            local refilled = math.floor(elapsed * refill_rate)
            tokens = math.min(capacity, tokens + refilled)

            if refilled > 0 then
                last_refill = now
            end

            -- Consume one token if available
            if tokens >= 1 then
                tokens = tokens - 1
                redis.call('HMSET', key, 'tokens', tokens, 'last_refill', last_refill)
                redis.call('EXPIRE', key, math.ceil(capacity / refill_rate) + 60)
                return 1
            end

            return 0
        `;

        const result = await (redis as any).eval(
            luaScript,
            1,
            bucketKey,
            capacity.toString(),
            refillRate.toString(),
            now.toString()
        );

        return result === 1;
    }

    /**
     * Legacy fixed-window check — kept for backward compatibility.
     * Prefer isAllowed() for new code.
     */
    static async isAllowedFixedWindow(key: string, limit: number, windowInSeconds: number): Promise<boolean> {
        const fullKey = `ratelimit:${key}`;
        const current = await redis.get(fullKey);

        if (current && parseInt(current) >= limit) {
            return false;
        }

        const multi = redis.multi();
        multi.incr(fullKey);
        if (!current) {
            multi.expire(fullKey, windowInSeconds);
        }
        await multi.exec();

        return true;
    }
}
