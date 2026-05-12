import { queueService } from './queue.service';
import { schedulerRepository } from './scheduler.repository';

// Mock BullMQ
jest.mock('bullmq', () => ({
    Queue: jest.fn().mockImplementation(() => ({
        add: jest.fn().mockResolvedValue({ id: 'job-1' }),
        getJob: jest.fn().mockResolvedValue({ remove: jest.fn().mockResolvedValue({}) }),
    })),
}));

// Mock Repository
jest.mock('./scheduler.repository', () => ({
    schedulerRepository: {
        create: jest.fn().mockResolvedValue({ _id: 'db-1', jobId: 'job-1' }),
        update: jest.fn().mockResolvedValue({}),
        findOne: jest.fn().mockResolvedValue({ _id: 'db-1', jobId: 'job-1', recurrence: 'daily' }),
        findByUser: jest.fn().mockResolvedValue([]),
        model: { find: jest.fn().mockResolvedValue([]) },
    },
}));

jest.mock('../../config/redis', () => ({
    redisConnection: {},
}));

jest.mock('../../utils/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn() },
}));

describe('QueueService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('scheduleMessage', () => {
        it('should throw if scheduledFor is in the past', async () => {
            const pastDate = new Date(Date.now() - 10000);
            await expect(queueService.scheduleMessage('u1', 't1', 'c1', 'hi', pastDate))
                .rejects.toThrow('Scheduled date must be in the future');
        });

        it('should create a BullMQ job for future messages', async () => {
            const futureDate = new Date(Date.now() + 10000);
            const result = await queueService.scheduleMessage('u1', 't1', 'c1', 'hi', futureDate);
            
            expect(result._id).toBe('db-1');
            expect(schedulerRepository.create).toHaveBeenCalled();
            expect(schedulerRepository.update).toHaveBeenCalledWith(
                { _id: 'db-1' }, { jobId: 'job-1' }
            );
        });
    });

    describe('scheduleNextRecurrence', () => {
        it('should handle daily, weekly, monthly', async () => {
            const now = new Date();
            
            // Daily
            await queueService.scheduleNextRecurrence('u1', 't1', 'c1', 'hi', now, 'daily');
            expect(schedulerRepository.create).toHaveBeenCalled();

            // Weekly
            await queueService.scheduleNextRecurrence('u1', 't1', 'c1', 'hi', now, 'weekly');
            
            // Monthly
            await queueService.scheduleNextRecurrence('u1', 't1', 'c1', 'hi', now, 'monthly');
        });

        it('should return null for invalid recurrence or ended series', async () => {
            const now = new Date();
            const res1 = await queueService.scheduleNextRecurrence('u1', 't1', 'c1', 'hi', now, 'none' as any);
            expect(res1).toBeNull();

            const pastEnd = new Date(Date.now() - 5000);
            const res2 = await queueService.scheduleNextRecurrence('u1', 't1', 'c1', 'hi', now, 'daily', pastEnd);
            expect(res2).toBeNull();
        });
    });

    describe('cancelMessage', () => {
        it('should remove job and update status', async () => {
            await queueService.cancelMessage('db-1');
            expect(schedulerRepository.update).toHaveBeenCalledWith({ _id: 'db-1' }, { status: 'cancelled' });
        });

        it('should throw if message not found', async () => {
            (schedulerRepository.findOne as jest.Mock).mockResolvedValueOnce(null);
            await expect(queueService.cancelMessage('invalid')).rejects.toThrow('Message not found');
        });

        it('should cancel series if requested', async () => {
            (schedulerRepository.findOne as jest.Mock).mockResolvedValueOnce({
                _id: 'db-1', jobId: 'job-1', recurrence: 'daily', parentJobId: 'series-1'
            });
            ((schedulerRepository as any).model.find as jest.Mock).mockResolvedValueOnce([
                { _id: 'db-2', jobId: 'job-2' }
            ]);

            await queueService.cancelMessage('db-1', true);
            expect(schedulerRepository.update).toHaveBeenCalledTimes(2);
        });
    });

    describe('getScheduledMessages', () => {
        it('should fetch by user', async () => {
            await queueService.getScheduledMessages('u1');
            expect(schedulerRepository.findByUser).toHaveBeenCalledWith('u1');
        });
    });
});
