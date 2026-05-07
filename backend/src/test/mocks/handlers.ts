import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock Graph API Me endpoint
  http.get('https://graph.microsoft.com/v1.0/me', () => {
    return HttpResponse.json({
      id: 'mock-user-id',
      displayName: 'Mock User',
      mail: 'mock@example.com'
    });
  }),

  // Mock Teams list
  http.get('https://graph.microsoft.com/v1.0/me/joinedTeams', () => {
    return HttpResponse.json({
      value: [
        { id: 'team-1', displayName: 'Mock Team 1' },
        { id: 'team-2', displayName: 'Mock Team 2' }
      ]
    });
  }),

  // Mock Message sending
  http.post('https://graph.microsoft.com/v1.0/teams/:teamId/channels/:channelId/messages', async ({ request }) => {
    const body: any = await request.json();
    if (!body.body.content) {
      return new HttpResponse(null, { status: 400 });
    }
    return HttpResponse.json({ id: 'mock-message-id' });
  }),
];
