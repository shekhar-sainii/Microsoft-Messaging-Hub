import { messagesService } from './messages.service';
import { messageRepository } from './message.repository';
import { auditRepository } from '../analytics/audit.repository';

// Mock Repositories directly
jest.mock('./message.repository', () => ({
    messageRepository: {
        create: jest.fn().mockResolvedValue({ _id: 'msg-1' }),
        find: jest.fn().mockResolvedValue([]),
        findOne: jest.fn().mockResolvedValue({ _id: 'msg-1' }),
        delete: jest.fn().mockResolvedValue(true),
    },
}));

jest.mock('../analytics/audit.repository', () => ({
    auditRepository: {
        log: jest.fn().mockResolvedValue({}),
        create: jest.fn().mockResolvedValue({}),
    },
}));

jest.mock('../../utils/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../utils/rateLimiter', () => ({
    RateLimiter: {
        throttle: jest.fn().mockImplementation((key, fn) => fn()),
        acquire: jest.fn().mockResolvedValue(true),
    },
}));

jest.mock('../../config/redis', () => ({
    redis: {
        eval: jest.fn().mockResolvedValue(1),
        get: jest.fn().mockResolvedValue(null),
        setex: jest.fn().mockResolvedValue('OK'),
    },
}));

// Graph client mock
const mockGraphClient = {
    api: jest.fn().mockReturnThis(),
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
};

describe('MessagesService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

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

        it('should handle mentions correctly', async () => {
            mockGraphClient.post.mockResolvedValue({ id: 'graph-id-123' });
            mockGraphClient.api.mockReturnValue(mockGraphClient);

            const mentions = [{
                id: 0,
                mentionText: 'Test User',
                mentioned: { user: { id: 'user-2', displayName: 'Test User' } }
            }];

            await messagesService.sendMessage(
                mockGraphClient as any,
                'team-1', 'channel-1', '<p>Hello @Test User</p>', 'user-1',
                { mentions }
            );

            expect(mockGraphClient.post).toHaveBeenCalledWith(
                expect.objectContaining({
                    mentions: expect.arrayContaining([
                        expect.objectContaining({ mentionText: 'Test User' })
                    ])
                })
            );
        });

        it('should log failure on error', async () => {
            mockGraphClient.api.mockReturnValue(mockGraphClient);
            mockGraphClient.post.mockRejectedValue(new Error('Graph error'));

            await expect(messagesService.sendMessage(
                mockGraphClient as any,
                'team-1', 'channel-1', 'test', 'user-1'
            )).rejects.toThrow('Graph error');

            expect(auditRepository.log).toHaveBeenCalledWith(
                expect.objectContaining({ status: 'failure' })
            );
        });
    });

    describe('sendAdaptiveCard', () => {
        it('should serialise card JSON as a STRING', async () => {
            mockGraphClient.post.mockResolvedValue({ id: 'card-msg-id' });
            mockGraphClient.api.mockReturnValue(mockGraphClient);

            const cardJson = { type: 'AdaptiveCard', version: '1.4', body: [] };

            await messagesService.sendAdaptiveCard(
                mockGraphClient as any,
                'team-1', 'channel-1', cardJson, 'user-1'
            );

            const postCall = mockGraphClient.post.mock.calls[0][0];
            expect(typeof postCall.attachments[0].content).toBe('string');
        });

        it('should log failure on adaptive card error', async () => {
            mockGraphClient.api.mockReturnValue(mockGraphClient);
            mockGraphClient.post.mockRejectedValue(new Error('Card error'));

            await expect(messagesService.sendAdaptiveCard(
                mockGraphClient as any,
                'team-1', 'channel-1', {}, 'user-1'
            )).rejects.toThrow('Card error');
        });
    });

    describe('replyToMessage', () => {
        it('should post to the replies endpoint', async () => {
            mockGraphClient.post.mockResolvedValue({ id: 'reply-id' });
            mockGraphClient.api.mockReturnValue(mockGraphClient);

            await messagesService.replyToMessage(
                mockGraphClient as any,
                'team-1', 'channel-1', 'parent-id', '<p>Reply</p>', 'user-1'
            );

            expect(mockGraphClient.api).toHaveBeenCalledWith(
                '/teams/team-1/channels/channel-1/messages/parent-id/replies'
            );
        });

        it('should throw on reply error', async () => {
            mockGraphClient.api.mockReturnValue(mockGraphClient);
            mockGraphClient.post.mockRejectedValue(new Error('Reply fail'));

            await expect(messagesService.replyToMessage(
                mockGraphClient as any,
                'team-1', 'channel-1', 'parent-id', 'test', 'user-1'
            )).rejects.toThrow('Reply fail');
        });
    });

    describe('deleteMessage', () => {
        it('should call delete on Graph and repository', async () => {
            mockGraphClient.api.mockReturnValue(mockGraphClient);
            mockGraphClient.delete.mockResolvedValue({});

            await messagesService.deleteMessage(mockGraphClient as any, 't1', 'c1', 'm1', 'u1');

            expect(mockGraphClient.delete).toHaveBeenCalled();
            expect(messageRepository.delete).toHaveBeenCalledWith({ messageId: 'm1' });
        });
    });

    describe('History & Retrieval', () => {
        it('should get replies', async () => {
            mockGraphClient.api.mockReturnValue(mockGraphClient);
            mockGraphClient.get.mockResolvedValue({ value: [] });
            await messagesService.getReplies(mockGraphClient as any, 't1', 'c1', 'm1');
            expect(mockGraphClient.get).toHaveBeenCalled();
        });

        it('should get sent message by ID', async () => {
            await messagesService.getSentMessageById('id-1');
            expect(messageRepository.findOne).toHaveBeenCalled();
        });

        it('should get sent history', async () => {
            await messagesService.getSentHistory('u1');
            expect(messageRepository.find).toHaveBeenCalled();
        });

        it('should search history', async () => {
            await messagesService.searchHistory('u1', 'test');
            expect(messageRepository.find).toHaveBeenCalledWith(
                expect.objectContaining({ content: expect.any(Object) })
            );
        });
    });
});
