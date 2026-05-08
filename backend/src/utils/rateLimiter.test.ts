import { RateLimiter } from './rateLimiter';
import { redis } from '../config/redis';

describe('RateLimiter', () => {
    const testKey = 'test-user-123';

    beforeEach(async () => {
        await redis.del(`ratelimit:${testKey}`);
    });

    it('should allow requests within limit', async () => {
        const allowed1 = await RateLimiter.acquire(testKey, 2, 60);
        const allowed2 = await RateLimiter.acquire(testKey, 2, 60);
        
        expect(allowed1).toBe(true);
        expect(allowed2).toBe(true);
    });

    it('should block requests exceeding limit', async () => {
        await RateLimiter.acquire(testKey, 1, 60);
        const blocked = await RateLimiter.acquire(testKey, 1, 60);
        
        expect(blocked).toBe(false);
    });

    it('should refill after interval', async () => {
        await RateLimiter.acquire(testKey, 1, 1);
        // Wait for expiry
        await new Promise(resolve => setTimeout(resolve, 1100));
        
        const allowed = await RateLimiter.acquire(testKey, 1, 1);
        expect(allowed).toBe(true);
    });

    it('should throttle and retry', async () => {
        const mockFn = jest.fn().mockResolvedValue('success');
        const result = await RateLimiter.throttle(testKey, mockFn);
        
        expect(result).toBe('success');
        expect(mockFn).toHaveBeenCalledTimes(1);
    });
});
