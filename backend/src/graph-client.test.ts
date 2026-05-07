import { GraphClient } from './utils/graph.client';
import { server } from './test/mocks/server';
import { http, HttpResponse } from 'msw';

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('GraphClient', () => {
    const client = new GraphClient('mock-token');

    it('should fetch joined teams correctly', async () => {
        const teams = await client.get('/me/joinedTeams');
        expect(teams.value).toHaveLength(2);
        expect(teams.value[0].displayName).toBe('Mock Team 1');
    });

    it('should handle 429 rate limiting and retry after Retry-After header', async () => {
        let callCount = 0;

        server.use(
            http.get('https://graph.microsoft.com/v1.0/me', () => {
                callCount++;
                if (callCount === 1) {
                    return new HttpResponse(null, {
                        status: 429,
                        headers: { 'Retry-After': '0' }, // 0 seconds for fast test
                    });
                }
                return HttpResponse.json({ displayName: 'Mock User' });
            })
        );

        const user = await client.get('/me');
        expect(user.displayName).toBe('Mock User');
        expect(callCount).toBe(2);
    }, 10000);

    it('should send messages correctly', async () => {
        const response = await client.post('/teams/t1/channels/c1/messages', {
            body: { content: 'Hello', contentType: 'html' },
        });
        expect(response.id).toBe('mock-message-id');
    });

    it('should open circuit breaker after 5 consecutive failures', async () => {
        // Reset static state
        (GraphClient as any).failureCount = 0;
        (GraphClient as any).circuitOpenUntil = 0;

        server.use(
            http.get('https://graph.microsoft.com/v1.0/me/drive', () => {
                return new HttpResponse(null, { status: 503 });
            })
        );

        // Make 5 failing requests to trip the circuit breaker
        for (let i = 0; i < 5; i++) {
            try {
                await client.get('/me/drive');
            } catch (_) {}
        }

        // Circuit should now be open
        expect((GraphClient as any).failureCount).toBeGreaterThanOrEqual(5);
    }, 30000);
});
