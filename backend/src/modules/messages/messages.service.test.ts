import { messagesService } from './messages.service';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Mock Mongoose models
jest.mock('../../models/SentMessage', () => ({
    default: {
        create: jest.fn().mockResolvedValue({ _id: 'msg-1', messageId: 'mock-graph-message-id' }),
        find: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            skip: jest.fn().mockResolvedValue([]),
        }),
        deleteOne: jest.fn().mockResolvedValue({}),
        findById: jest.fn().mockResolvedValue(null),
    },
}));

jest.mock('../../models/AuditLog', () => ({
    AuditLogModel: {
        create: jest.fn().mockResolvedValue({}),
    },
}));

jest.mock('../../utils/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

// MSW v2 server — mocks Graph API
const server = setupServer(
    http.post('https://graph.microsoft.com/v1.0/teams/:teamId/channels/:channelId/messages', () => {
        return HttpResponse.json({
            id: 'mock-graph-message-id',
            body: { content: 'mocked content', contentType: 'html' },
            createdDateTime: new Date().toISOString(),
        }, { status: 201 });
    }),
    http.delete('https://graph.microsoft.com/v1.0/teams/:teamId/channels/:channelId/messages/:msgId', () => {
        return new HttpResponse(null, { status: 204 });
    }),
);

// Graph client mock
const mockGraphClient = {
    api: jest.fn().mockReturnThis(),
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
};

describe('MessagesService', () => {
    beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
    afterEach(() => {
        server.resetHandlers();
        jest.clearAllMocks();
    });
    afterAll(() => server.close());

    describe('sendMessage', () => {
        it('should build correct Graph payload with HTML body', async () => {
            mockGraphClient.post.mockResolvedValue({
                id: 'mock-graph-message-id',
                body: { content: '<p>Hello</p>' },
            });
            mockGraphClient.api.mockReturnValue(mockGraphClient);

            const result = await messagesService.sendMessage(
                mockGraphClient as any,
                'team-1',
                'channel-1',
                '<p>Hello World</p>',
                'user-1',
                { importance: 'high', subject: 'Test Subject' }
            );

            expect(mockGraphClient.api).toHaveBeenCalledWith(
                '/teams/team-1/channels/channel-1/messages'
            );
            expect(mockGraphClient.post).toHaveBeenCalledWith(
                expect.objectContaining({
                    body: { contentType: 'html', content: '<p>Hello World</p>' },
                    importance: 'high',
                    subject: 'Test Subject',
                })
            );
        });

        it('should save to SentMessage collection after successful send', async () => {
            const SentMessageModel = require('../../models/SentMessage').default;
            mockGraphClient.post.mockResolvedValue({ id: 'graph-id-123' });
            mockGraphClient.api.mockReturnValue(mockGraphClient);

            await messagesService.sendMessage(
                mockGraphClient as any,
                'team-1', 'channel-1', '<p>Test</p>', 'user-1'
            );

            expect(SentMessageModel.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    messageId: 'graph-id-123',
                    teamId: 'team-1',
                    channelId: 'channel-1',
                    userId: 'user-1',
                    status: 'sent',
                })
            );
        });
    });

    describe('sendAdaptiveCard', () => {
        it('should serialise card JSON as a STRING (critical Graph requirement)', async () => {
            mockGraphClient.post.mockResolvedValue({ id: 'card-msg-id' });
            mockGraphClient.api.mockReturnValue(mockGraphClient);

            const cardJson = { type: 'AdaptiveCard', version: '1.4', body: [] };

            await messagesService.sendAdaptiveCard(
                mockGraphClient as any,
                'team-1', 'channel-1', cardJson, 'user-1'
            );

            const postCall = mockGraphClient.post.mock.calls[0][0];
            const attachment = postCall.attachments[0];

            // CRITICAL: content must be a string, not an object
            expect(typeof attachment.content).toBe('string');
            expect(attachment.contentType).toBe('application/vnd.microsoft.card.adaptive');

            // Verify it's valid JSON when parsed back
            const parsed = JSON.parse(attachment.content);
            expect(parsed.type).toBe('AdaptiveCard');
        });
    });

    describe('replyToMessage', () => {
        it('should post to the replies endpoint', async () => {
            mockGraphClient.post.mockResolvedValue({ id: 'reply-id' });
            mockGraphClient.api.mockReturnValue(mockGraphClient);

            await messagesService.replyToMessage(
                mockGraphClient as any,
                'team-1', 'channel-1', 'parent-msg-id', '<p>Reply</p>', 'user-1'
            );

            expect(mockGraphClient.api).toHaveBeenCalledWith(
                '/teams/team-1/channels/channel-1/messages/parent-msg-id/replies'
            );
        });
    });
});
