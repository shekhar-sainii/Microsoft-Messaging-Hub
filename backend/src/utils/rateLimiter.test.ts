import { RateLimiter } from './rateLimiter';

// Mock Redis with eval support
const mockEval = jest.fn();
jest.mock('../config/redis', () => ({
    redis: {
        get: jest.fn(),
        multi: jest.fn().mockReturnValue({
            incr: jest.fn().mockReturnThis(),
            expire: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue([1, 1]),
        }),
        eval: mockEval,
    },
}));

describe('RateLimiter (Token Bucket)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should allow request when bucket has tokens', async () => {
        mockEval.mockResolvedValue(1); // 1 = allowed

        const allowed = await RateLimiter.isAllowed('user-1', 10, 1);
        expect(allowed).toBe(true);
    });

    it('should deny request when bucket is empty', async () => {
        mockEval.mockResolvedValue(0); // 0 = denied

        const allowed = await RateLimiter.isAllowed('user-1', 10, 1);
        expect(allowed).toBe(false);
    });

    it('should use different keys for different users', async () => {
        mockEval.mockResolvedValue(1);

        await RateLimiter.isAllowed('user-A', 10, 1);
        await RateLimiter.isAllowed('user-B', 10, 1);

        expect(mockEval).toHaveBeenCalledTimes(2);
        const firstCall = mockEval.mock.calls[0];
        const secondCall = mockEval.mock.calls[1];
        expect(firstCall[2]).toContain('user-A');
        expect(secondCall[2]).toContain('user-B');
    });
});

describe('RateLimiter (Fixed Window fallback)', () => {
    it('should allow request under limit', async () => {
        const { redis } = require('../config/redis');
        redis.get.mockResolvedValue('3'); // 3 requests so far

        const allowed = await RateLimiter.isAllowedFixedWindow('user-1', 10, 60);
        expect(allowed).toBe(true);
    });

    it('should deny request at limit', async () => {
        const { redis } = require('../config/redis');
        redis.get.mockResolvedValue('10'); // at limit

        const allowed = await RateLimiter.isAllowedFixedWindow('user-1', 10, 60);
        expect(allowed).toBe(false);
    });
});
