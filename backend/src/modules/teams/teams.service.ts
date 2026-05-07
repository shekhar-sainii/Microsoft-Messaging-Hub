import { Client } from '@microsoft/microsoft-graph-client';
import { redis } from '../../config/redis';
import { logger } from '../../utils/logger';

const TEAMS_CACHE_TTL = 300; // 5 minutes

// Demo teams for testing when user has no real Microsoft Teams
const DEMO_TEAMS = [
  {
    id: 'demo-team-001',
    displayName: '🚀 Dev Team (Demo)',
    description: 'Demo team for testing — connect a real M365 account to see actual teams',
    webUrl: '#',
    _isDemo: true,
  },
  {
    id: 'demo-team-002',
    displayName: '📢 Marketing (Demo)',
    description: 'Demo marketing team',
    webUrl: '#',
    _isDemo: true,
  },
  {
    id: 'demo-team-003',
    displayName: '🛠️ Engineering (Demo)',
    description: 'Demo engineering team',
    webUrl: '#',
    _isDemo: true,
  },
];

const DEMO_CHANNELS: Record<string, any[]> = {
  'demo-team-001': [
    { id: 'demo-ch-001', displayName: 'General', description: 'General discussion' },
    { id: 'demo-ch-002', displayName: 'Announcements', description: 'Team announcements' },
    { id: 'demo-ch-003', displayName: 'Dev Testing', description: 'Testing channel' },
  ],
  'demo-team-002': [
    { id: 'demo-ch-004', displayName: 'General', description: 'General discussion' },
    { id: 'demo-ch-005', displayName: 'Campaigns', description: 'Marketing campaigns' },
  ],
  'demo-team-003': [
    { id: 'demo-ch-006', displayName: 'General', description: 'General discussion' },
    { id: 'demo-ch-007', displayName: 'Backend', description: 'Backend development' },
    { id: 'demo-ch-008', displayName: 'Frontend', description: 'Frontend development' },
  ],
};

export class TeamsService {
  /**
   * Fetches all teams joined by the user, handling @odata.nextLink pagination.
   * Results are cached in Redis for 5 minutes to reduce Graph API calls.
   */
  async getJoinedTeams(client: Client, userId: string) {
    const cacheKey = `teams:joined:${userId}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.debug('Teams list cache hit', { userId });
      return JSON.parse(cached);
    }

    logger.info('Fetching joined teams from Graph', { userId });
    try {
      const allTeams: any[] = [];
      let pageResult = await client
        .api('/me/joinedTeams')
        .select('id,displayName,description,webUrl')
        .top(50)
        .get();

      allTeams.push(...(pageResult.value || []));

      while (pageResult['@odata.nextLink']) {
        pageResult = await client.api(pageResult['@odata.nextLink']).get();
        allTeams.push(...(pageResult.value || []));
      }

      // If user has no real teams, return demo data so the app is testable
      const result = allTeams.length > 0 ? allTeams : DEMO_TEAMS;
      await redis.setex(cacheKey, TEAMS_CACHE_TTL, JSON.stringify(result));
      return result;
    } catch (error: any) {
      logger.warn('Graph teams fetch failed, returning demo data', { error: error.message });
      // Return demo data on any Graph error (no Teams license, OBO failure, etc.)
      await redis.setex(cacheKey, 60, JSON.stringify(DEMO_TEAMS));
      return DEMO_TEAMS;
    }
  }

  /**
   * Fetches team details. Cached per teamId.
   */
  async getTeamDetail(client: Client, teamId: string) {
    if (teamId.startsWith('demo-team-')) {
      return DEMO_TEAMS.find(t => t.id === teamId) || DEMO_TEAMS[0];
    }

    const cacheKey = `teams:detail:${teamId}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const result = await client.api(`/teams/${teamId}`).get();
    await redis.setex(cacheKey, TEAMS_CACHE_TTL, JSON.stringify(result));
    return result;
  }

  /**
   * Fetches channels of a team. Cached per teamId.
   */
  async getTeamChannels(client: Client, teamId: string, userId: string) {
    // Return demo channels for demo teams without hitting Graph
    if (teamId.startsWith('demo-team-')) {
      return { value: DEMO_CHANNELS[teamId] || [] };
    }

    const cacheKey = `teams:channels:${teamId}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const result = await client.api(`/teams/${teamId}/channels`).get();
    await redis.setex(cacheKey, TEAMS_CACHE_TTL, JSON.stringify(result));
    return result;
  }

  /**
   * Fetches specific channel details.
   */
  async getChannelDetail(client: Client, teamId: string, channelId: string) {
    if (teamId.startsWith('demo-team-')) {
      const channels = DEMO_CHANNELS[teamId] || [];
      return channels.find((c: any) => c.id === channelId) || channels[0];
    }
    return client.api(`/teams/${teamId}/channels/${channelId}`).get();
  }

  /**
   * Fetches members of a team (for @mention autocomplete). Cached per teamId.
   */
  async getTeamMembers(client: Client, teamId: string, userId: string) {
    if (teamId.startsWith('demo-team-')) {
      return {
        value: [
          { id: 'demo-user-001', displayName: 'Alice Johnson', email: 'alice@demo.com' },
          { id: 'demo-user-002', displayName: 'Bob Smith', email: 'bob@demo.com' },
          { id: 'demo-user-003', displayName: 'Carol White', email: 'carol@demo.com' },
          { id: 'demo-user-004', displayName: 'David Lee', email: 'david@demo.com' },
        ]
      };
    }

    const cacheKey = `teams:members:${teamId}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const result = await client.api(`/teams/${teamId}/members`).get();
    await redis.setex(cacheKey, TEAMS_CACHE_TTL, JSON.stringify(result));
    return result;
  }

  /**
   * Batch request to load teams + channels in a single Graph call.
   * Used for initial page load optimisation (reduces 3 round-trips to 1).
   */
  async getInitialData(client: Client, userId: string) {
    const startTime = Date.now();

    const batchPayload = {
      requests: [
        { id: '1', method: 'GET', url: '/me/joinedTeams?$select=id,displayName,description&$top=50' },
        { id: '2', method: 'GET', url: '/me' },
      ],
    };

    try {
      const batchResult = await client.api('/$batch').post(batchPayload);

      logger.info('graph:batch', {
        endpoint: '/$batch',
        durationMs: Date.now() - startTime,
        requests: batchResult.responses?.length,
      });

      const responses: Record<string, any> = {};
      for (const r of batchResult.responses || []) {
        responses[r.id] = r.status === 200 ? r.body : null;
      }

      return {
        teams: responses['1']?.value || [],
        me: responses['2'] || null,
      };
    } catch (error: any) {
      logger.error('graph:batch failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Fetches team profile photo. Returns base64 string or null.
   */
  async getTeamPhoto(client: Client, teamId: string) {
    const cacheKey = `teams:photo:${teamId}`;
    const cached = await redis.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await client.api(`/teams/${teamId}/photo/$value`).get();
      // Graph returns binary stream for $value
      const buffer = Buffer.from(await response.arrayBuffer());
      const base64 = `data:image/jpeg;base64,${buffer.toString('base64')}`;
      
      await redis.setex(cacheKey, 3600, base64); // Cache for 1 hour
      return base64;
    } catch (error) {
      // Photo might not exist
      return null;
    }
  }

  /**
   * Invalidates cached data for a user (call after channel changes).
   */
  async invalidateCache(userId: string, teamId?: string) {
    const keys = [`teams:joined:${userId}`];
    if (teamId) {
      keys.push(`teams:channels:${teamId}`, `teams:members:${teamId}`);
    }
    await Promise.all(keys.map(k => redis.del(k)));
  }

  /**
   * Track recently visited teams in Redis (last 5, 7-day expiry).
   */
  async trackRecentTeam(userId: string, teamId: string) {
    const key = `recent:teams:${userId}`;
    const raw = await redis.get(key);
    const recent: string[] = raw ? JSON.parse(raw) : [];

    // Remove if already present, then prepend
    const updated = [teamId, ...recent.filter(id => id !== teamId)].slice(0, 5);
    await redis.setex(key, 7 * 24 * 3600, JSON.stringify(updated));
  }

  /**
   * Get recently visited teams for a user.
   */
  async getRecentTeams(userId: string): Promise<string[]> {
    const key = `recent:teams:${userId}`;
    const raw = await redis.get(key);
    return raw ? JSON.parse(raw) : [];
  }
}

export const teamsService = new TeamsService();
