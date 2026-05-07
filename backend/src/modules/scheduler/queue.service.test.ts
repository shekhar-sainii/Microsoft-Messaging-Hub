import { QueueService } from './queue.service';

// Mock BullMQ Queue
jest.mock('bullmq', () => ({
    Queue: jest.fn().mockImplementation(() => ({
        add: jest.fn().mockResolvedValue({ id: 'job-123' }),
        getJob: jest.fn().mockResolvedValue({ remove: jest.fn() }),
    })),
}));

// Mock ScheduledMessage model
jest.mock('../../models/ScheduledMessage', () => {
    const mockSave = jest.fn().mockResolvedValue(true);
    const MockModel = jest.fn().mockImplementation((data: any) => ({
        ...data,
        _id: 'msg-db-id',
        save: mockSave,
        jobId: undefined,
    }));
    MockModel.findById = jest.fn();
    return { default: MockModel, ScheduledMessageModel: MockModel };
});

jest.mock('../../config/redis', () => ({
    redisConnection: { host: 'localhost', port: 6379 },
}));

describe('QueueService', () => {
    let queueService: QueueService;

    beforeEach(() => {
        jest.clearAllMocks();
        queueService = new QueueService();
    });

    describe('scheduleMessage', () => {
        it('should throw if scheduledFor is in the past', async () => {
            const pastDate = new Date(Date.now() - 60000);
            await expect(
                queueService.scheduleMessage('user-1', 'team-1', 'ch-1', 'content', pastDate)
            ).rejects.toThrow('Scheduled date must be in the future');
        });

        it('should create a BullMQ job for future messages', async () => {
            const futureDate = new Date(Date.now() + 60000);
            const result = await queueService.scheduleMessage(
                'user-1', 'team-1', 'ch-1', '<p>Hello</p>', futureDate
            );
            expect(result).toBeDefined();
        });
    });

    describe('scheduleMessage with recurrence', () => {
        it('should accept recurrence type', async () => {
            const futureDate = new Date(Date.now() + 3600000);
            const result = await queueService.scheduleMessage(
                'user-1', 'team-1', 'ch-1', 'Weekly update', futureDate, 'weekly'
            );
            expect(result).toBeDefined();
        });
    });
});
