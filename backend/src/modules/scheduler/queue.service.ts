import { Queue } from 'bullmq';
import { redisConnection } from '../../config/redis';
import { RecurrenceType } from '../../models/ScheduledMessage';
import { logger } from '../../utils/logger';
import { schedulerRepository } from './scheduler.repository';

export class QueueService {
    private messageQueue: Queue;

    constructor() {
        this.messageQueue = new Queue('message-scheduler', {
            connection: redisConnection,
            defaultJobOptions: {
                attempts: 5,
                backoff: {
                    type: 'exponential',
                    delay: 5000,
                },
                removeOnComplete: true,
            },
        });
    }

    async scheduleMessage(
        userId: string,
        teamId: string,
        channelId: string,
        content: string,
        scheduledFor: Date,
        recurrence: RecurrenceType = 'none',
        recurrenceEndDate?: Date
    ) {
        const delay = scheduledFor.getTime() - Date.now();
        if (delay < 0) throw new Error('Scheduled date must be in the future');

        const scheduledMessage = await schedulerRepository.create({
            userId,
            teamId,
            channelId,
            content,
            scheduledFor,
            status: 'pending',
            recurrence,
            recurrenceEndDate,
        } as any);

        const job = await this.messageQueue.add(
            'send-message',
            {
                dbId: scheduledMessage._id,
                teamId,
                channelId,
                content,
                userId,
                recurrence,
                recurrenceEndDate: recurrenceEndDate?.toISOString(),
            },
            { delay }
        );

        await schedulerRepository.update({ _id: scheduledMessage._id }, { jobId: job.id });
        logger.info('Scheduled message created', { dbId: scheduledMessage._id });
        return scheduledMessage;
    }

    async scheduleNextRecurrence(
        userId: string, teamId: string, channelId: string, content: string,
        lastScheduledFor: Date, recurrence: RecurrenceType, recurrenceEndDate?: Date, parentJobId?: string
    ) {
        const next = new Date(lastScheduledFor);
        switch (recurrence) {
            case 'daily': next.setDate(next.getDate() + 1); break;
            case 'weekly': next.setDate(next.getDate() + 7); break;
            case 'monthly': next.setMonth(next.getMonth() + 1); break;
            default: return null;
        }

        if (recurrenceEndDate && next > recurrenceEndDate) return null;

        const delay = next.getTime() - Date.now();
        if (delay < 0) return null;

        const nextMessage = await schedulerRepository.create({
            userId, teamId, channelId, content, scheduledFor: next, status: 'pending',
            recurrence, recurrenceEndDate, parentJobId,
        } as any);

        const job = await this.messageQueue.add('send-message', {
            dbId: nextMessage._id, teamId, channelId, content, userId, recurrence,
            recurrenceEndDate: recurrenceEndDate?.toISOString(), parentJobId,
        }, { delay });

        await schedulerRepository.update({ _id: nextMessage._id }, { jobId: job.id });
        return nextMessage;
    }

    async cancelMessage(dbId: string, cancelSeries = false) {
        const scheduledMessage = await schedulerRepository.findOne({ _id: dbId });
        if (!scheduledMessage) throw new Error('Message not found');

        if (scheduledMessage.jobId) {
            const job = await this.messageQueue.getJob(scheduledMessage.jobId);
            if (job) await job.remove();
        }

        await schedulerRepository.update({ _id: dbId }, { status: 'cancelled' });

        if (cancelSeries && scheduledMessage.recurrence !== 'none') {
            const seriesId = scheduledMessage.parentJobId || dbId;
            const futureMsgs = await (schedulerRepository as any).model.find({
                $or: [{ parentJobId: seriesId }, { _id: seriesId }],
                status: 'pending',
                _id: { $ne: dbId },
            });

            for (const msg of futureMsgs) {
                if (msg.jobId) {
                    const job = await this.messageQueue.getJob(msg.jobId);
                    if (job) await job.remove();
                }
                await schedulerRepository.update({ _id: msg._id }, { status: 'cancelled' });
            }
        }
        return scheduledMessage;
    }

    async getScheduledMessages(userId: string) {
        return schedulerRepository.findByUser(userId);
    }
}

export const queueService = new QueueService();
