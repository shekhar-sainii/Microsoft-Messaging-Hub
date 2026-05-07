import { TeamsService } from './teams.service';

// Mock Redis
jest.mock('../../config/redis', () => ({
    redis: {
        get: jest.fn().mockResolvedValue(null),
        setex: jest.fn().mockResolvedValue('OK'),
        set: jest.fn().mockResolvedValue('OK'),
        del: jest.fn().mockResolvedValue(1),
    },
}));

const mockGraphClient = {
    api: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    top: jest.fn().mockReturnThis(),
    get: jest.fn(),
    post: jest.fn(),
};

describe('TeamsService', () => {
    let teamsService: TeamsService;

    beforeEach(() => {
        jest.clearAllMocks();
        teamsService = new TeamsService();
    });

    describe('getJoinedTeams', () => {
        it('should fetch teams from Graph and cache in Redis', async () => {
            const mockTeams = [
                { id: 'team-1', displayName: 'Team One' },
                { id: 'team-2', displayName: 'Team Two' },
            ];

            mockGraphClient.get.mockResolvedValue({ value: mockTeams });

            const result = await teamsService.getJoinedTeams(mockGraphClient as any, 'user-1');

            expect(result).toEqual(mockTeams);
        });

        it('should return demo teams when Graph returns empty array', async () => {
            mockGraphClient.get.mockResolvedValue({ value: [] });

            const result = await teamsService.getJoinedTeams(mockGraphClient as any, 'user-1');

            expect(result.length).toBeGreaterThan(0);
            expect(result[0].id).toContain('demo-team');
        });

        it('should return demo teams on Graph error', async () => {
            mockGraphClient.get.mockRejectedValue(new Error('Graph API error'));

            const result = await teamsService.getJoinedTeams(mockGraphClient as any, 'user-1');

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
        });

        it('should return cached data from Redis if available', async () => {
            const { redis } = require('../../config/redis');
            const cachedTeams = [{ id: 'cached-team', displayName: 'Cached Team' }];
            redis.get.mockResolvedValue(JSON.stringify(cachedTeams));

            const result = await teamsService.getJoinedTeams(mockGraphClient as any, 'user-1');

            expect(result).toEqual(cachedTeams);
            expect(mockGraphClient.get).not.toHaveBeenCalled();
        });
    });

    describe('getTeamChannels', () => {
        it('should return demo channels for demo teams without calling Graph', async () => {
            const result = await teamsService.getTeamChannels(mockGraphClient as any, 'demo-team-001', 'user-1');

            expect(result.value).toBeDefined();
            expect(mockGraphClient.get).not.toHaveBeenCalled();
        });

        it('should fetch channels from Graph for real teams', async () => {
            const mockChannels = { value: [{ id: 'ch-1', displayName: 'General' }] };
            mockGraphClient.get.mockResolvedValue(mockChannels);

            const result = await teamsService.getTeamChannels(mockGraphClient as any, 'real-team-id', 'user-1');

            expect(result).toEqual(mockChannels);
        });
    });

    describe('trackRecentTeam', () => {
        it('should store recent teams in Redis with 7-day expiry', async () => {
            const { redis } = require('../../config/redis');

            await teamsService.trackRecentTeam('user-1', 'team-abc');

            expect(redis.setex).toHaveBeenCalledWith(
                'recent:teams:user-1',
                7 * 24 * 3600,
                expect.any(String)
            );
        });
    });
});
