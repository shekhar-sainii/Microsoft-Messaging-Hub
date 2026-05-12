import { teamsService } from './teams.service';
import { redis } from '../../config/redis';
import { GraphBatch } from '../../utils/graphBatch';

// Mock Redis
jest.mock('../../config/redis', () => ({
    redis: {
        get: jest.fn(),
        setex: jest.fn().mockResolvedValue('OK'),
    },
}));

// Mock GraphBatch
jest.mock('../../utils/graphBatch', () => ({
    GraphBatch: {
        execute: jest.fn(),
        mapResponses: jest.fn(),
    },
}));

jest.mock('../../utils/rateLimiter', () => ({
    RateLimiter: {
        throttle: jest.fn().mockImplementation((key, fn) => fn()),
    },
}));

jest.mock('../../utils/logger', () => ({
    logger: { warn: jest.fn(), info: jest.fn(), error: jest.fn() },
}));

const mockGraphClient = {
    api: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    top: jest.fn().mockReturnThis(),
    get: jest.fn(),
};

describe('TeamsService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getJoinedTeams', () => {
        it('should return cached teams if available', async () => {
            const cachedTeams = [{ id: 't1', displayName: 'Cached Team' }];
            (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(cachedTeams));

            const result = await teamsService.getJoinedTeams(mockGraphClient as any, 'u1');

            expect(result).toEqual(cachedTeams);
            expect(mockGraphClient.api).not.toHaveBeenCalled();
        });

        it('should fetch from Graph and handle pagination', async () => {
            (redis.get as jest.Mock).mockResolvedValue(null);
            
            // First page
            mockGraphClient.get
                .mockResolvedValueOnce({
                    value: [{ id: 't1' }],
                    '@odata.nextLink': 'https://graph.microsoft.com/next'
                })
                .mockResolvedValueOnce({
                    value: [{ id: 't2' }]
                });

            const result = await teamsService.getJoinedTeams(mockGraphClient as any, 'u1');

            expect(result).toHaveLength(2);
            expect(mockGraphClient.api).toHaveBeenCalledWith('/me/joinedTeams');
            expect(mockGraphClient.api).toHaveBeenCalledWith('https://graph.microsoft.com/next');
        });

        it('should return demo teams on error', async () => {
            (redis.get as jest.Mock).mockResolvedValue(null);
            mockGraphClient.get.mockRejectedValue(new Error('Graph error'));

            const result = await teamsService.getJoinedTeams(mockGraphClient as any, 'u1');

            expect(result[0]._isDemo).toBe(true);
        });
    });

    describe('getTeamDetail', () => {
        it('should handle demo team ID', async () => {
            const result = await teamsService.getTeamDetail(mockGraphClient as any, 'demo-team-001');
            expect(result.id).toBe('demo-team-001');
        });

        it('should fetch from Graph for real IDs', async () => {
            mockGraphClient.get.mockResolvedValue({ id: 'real-t1' });
            const result = await teamsService.getTeamDetail(mockGraphClient as any, 'real-t1');
            expect(mockGraphClient.api).toHaveBeenCalledWith('/teams/real-t1');
            expect(result.id).toBe('real-t1');
        });
    });

    describe('Batching & Initial Data', () => {
        it('should use GraphBatch for initial data', async () => {
            (GraphBatch.execute as jest.Mock).mockResolvedValue([]);
            (GraphBatch.mapResponses as jest.Mock).mockReturnValue({
                teams: { value: [{ id: 't1' }] },
                me: { displayName: 'User' }
            });

            const result = await teamsService.getInitialData(mockGraphClient as any, 'u1');

            expect(result.teams).toHaveLength(1);
            expect(result.me.displayName).toBe('User');
        });
    });

    describe('Recent Teams', () => {
        it('should track and retrieve recent teams', async () => {
            (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(['t2', 't3']));
            
            await teamsService.trackRecentTeam('u1', 't1');
            
            expect(redis.setex).toHaveBeenCalledWith(
                expect.stringContaining('recent:teams'),
                expect.any(Number),
                expect.stringContaining('t1')
            );

            const recent = await teamsService.getRecentTeams('u1');
            expect(recent).toEqual(['t2', 't3']);
        });
    });

    describe('Photo handling', () => {
        it('should handle photo fetch and caching', async () => {
            (redis.get as jest.Mock).mockResolvedValue(null);
            mockGraphClient.get.mockResolvedValue({
                arrayBuffer: () => Promise.resolve(Buffer.from('photo-data'))
            });

            const photo = await teamsService.getTeamPhoto(mockGraphClient as any, 't1');
            expect(photo).toContain('data:image/jpeg;base64');
            expect(redis.setex).toHaveBeenCalled();
        });

        it('should return null on photo error', async () => {
            mockGraphClient.get.mockRejectedValue(new Error('No photo'));
            const photo = await teamsService.getTeamPhoto(mockGraphClient as any, 't1');
            expect(photo).toBeNull();
        });
    });

    describe('Channels & Members', () => {
        it('should handle demo channels', async () => {
            const result = await teamsService.getTeamChannels(mockGraphClient as any, 'demo-team-001', 'u1');
            expect(result.value).toHaveLength(3);
        });

        it('should handle real channels with caching', async () => {
            (redis.get as jest.Mock).mockResolvedValue(null);
            mockGraphClient.get.mockResolvedValue({ value: [{ id: 'c1' }] });
            
            const result = await teamsService.getTeamChannels(mockGraphClient as any, 'real-t1', 'u1');
            expect(result.value).toHaveLength(1);
            expect(redis.setex).toHaveBeenCalled();
        });

        it('should handle channel detail and members', async () => {
            mockGraphClient.get.mockResolvedValue({ id: 'c1' });
            await teamsService.getChannelDetail(mockGraphClient as any, 'real-t1', 'c1');
            expect(mockGraphClient.api).toHaveBeenCalledWith('/teams/real-t1/channels/c1');

            mockGraphClient.get.mockResolvedValue({ value: [] });
            await teamsService.getTeamMembers(mockGraphClient as any, 'real-t1', 'u1');
            expect(mockGraphClient.api).toHaveBeenCalledWith('/teams/real-t1/members');
        });
    });
});
