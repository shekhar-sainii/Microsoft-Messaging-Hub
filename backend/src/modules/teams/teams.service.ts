import { Client } from '@microsoft/microsoft-graph-client';
import { redis } from '../../config/redis';
import { logger } from '../../utils/logger';
import { RateLimiter } from '../../utils/rateLimiter';
import { GraphBatch } from '../../utils/graphBatch';

const TEAMS_CACHE_TTL = 300; // 5 minutes

const DEMO_TEAMS = [
  { id: 'demo-team-001', displayName: '🚀 Dev Team (Demo)', description: 'Demo team for testing', webUrl: '#', _isDemo: true },
  { id: 'demo-team-002', displayName: '📢 Marketing (Demo)', description: 'Demo marketing team', webUrl: '#', _isDemo: true },
];

export class TeamsService {
  async getJoinedTeams(client: Client, userId: string) {
    const cacheKey = `teams:joined:${userId}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    return RateLimiter.throttle(userId, async () => {
        try {
            const allTeams: any[] = [];
            let pageResult = await client.api('/me/joinedTeams').select('id,displayName,description,webUrl').top(50).get();
            allTeams.push(...(pageResult.value || []));

            while (pageResult['@odata.nextLink']) {
                pageResult = await client.api(pageResult['@odata.nextLink']).get();
                allTeams.push(...(pageResult.value || []));
            }

            const result = allTeams.length > 0 ? allTeams : DEMO_TEAMS;
            await redis.setex(cacheKey, TEAMS_CACHE_TTL, JSON.stringify(result));
            return result;
        } catch (error: any) {
            logger.warn('Graph teams fetch failed', { error: error.message });
            return DEMO_TEAMS;
        }
    });
  }

  async getTeamDetail(client: Client, teamId: string) {
    if (teamId.startsWith('demo-team-')) {
        return DEMO_TEAMS.find(t => t.id === teamId) || DEMO_TEAMS[0];
    }
    return client.api(`/teams/${teamId}`).get();
  }

  async getTeamChannels(client: Client, teamId: string, userId: string) {
    if (teamId.startsWith('demo-team-')) return { value: [] };

    const cacheKey = `teams:channels:${teamId}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    return RateLimiter.throttle(userId, async () => {
        const result = await client.api(`/teams/${teamId}/channels`).get();
        await redis.setex(cacheKey, TEAMS_CACHE_TTL, JSON.stringify(result));
        return result;
    });
  }

  async getChannelDetail(client: Client, teamId: string, channelId: string) {
    if (teamId.startsWith('demo-team-')) return { id: channelId, displayName: 'Demo Channel' };
    return client.api(`/teams/${teamId}/channels/${channelId}`).get();
  }

  async getTeamMembers(client: Client, teamId: string, userId: string) {
    if (teamId.startsWith('demo-team-')) return { value: [] };
    return client.api(`/teams/${teamId}/members`).get();
  }

  async getInitialData(client: Client, userId: string) {
    return RateLimiter.throttle(userId, async () => {
        const requests = [
            { id: 'teams', method: 'GET', url: '/me/joinedTeams?$select=id,displayName,description&$top=50' },
            { id: 'me', method: 'GET', url: '/me' }
        ];

        const batchResponses = await GraphBatch.execute(client, requests);
        const mapped = GraphBatch.mapResponses(batchResponses);

        return {
            teams: mapped['teams']?.value || [],
            me: mapped['me'] || null
        };
    });
  }

  async getTeamPhoto(client: Client, teamId: string) {
    const cacheKey = `teams:photo:${teamId}`;
    const cached = await redis.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await client.api(`/teams/${teamId}/photo/$value`).get();
      const buffer = Buffer.from(await response.arrayBuffer());
      const base64 = `data:image/jpeg;base64,${buffer.toString('base64')}`;
      await redis.setex(cacheKey, 3600, base64);
      return base64;
    } catch (error) {
      return null;
    }
  }

  async trackRecentTeam(userId: string, teamId: string) {
    const key = `recent:teams:${userId}`;
    const raw = await redis.get(key);
    const recent: string[] = raw ? JSON.parse(raw) : [];
    const updated = [teamId, ...recent.filter(id => id !== teamId)].slice(0, 5);
    await redis.setex(key, 7 * 24 * 3600, JSON.stringify(updated));
  }

  async getRecentTeams(userId: string): Promise<string[]> {
    const key = `recent:teams:${userId}`;
    const raw = await redis.get(key);
    return raw ? JSON.parse(raw) : [];
  }
}

export const teamsService = new TeamsService();
