import { Queue } from 'bullmq';
import { redisConnection } from '../../config/redis';
import ScheduledMessageModel, { RecurrenceType } from '../../models/ScheduledMessage';
import { logger } from '../../utils/logger';

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

    /**
     * Schedules a message for future delivery.
     * Supports one-time and recurring messages (daily / weekly / monthly).
     */
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

        if (delay < 0) {
            throw new Error('Scheduled date must be in the future');
        }

        const scheduledMessage = new ScheduledMessageModel({
            userId,
            teamId,
            channelId,
            content,
            scheduledFor,
            status: 'pending',
            recurrence,
            recurrenceEndDate,
        });

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

        scheduledMessage.jobId = job.id;
        await scheduledMessage.save();

        logger.info('Scheduled message created', {
            dbId: scheduledMessage._id,
            scheduledFor,
            recurrence,
        });

        return scheduledMessage;
    }

    /**
     * Schedules the next occurrence of a recurring message.
     * Called by the worker after successful delivery.
     */
    async scheduleNextRecurrence(
        userId: string,
        teamId: string,
        channelId: string,
        content: string,
        lastScheduledFor: Date,
        recurrence: RecurrenceType,
        recurrenceEndDate?: Date,
        parentJobId?: string
    ) {
        const next = new Date(lastScheduledFor);

        switch (recurrence) {
            case 'daily':
                next.setDate(next.getDate() + 1);
                break;
            case 'weekly':
                next.setDate(next.getDate() + 7);
                break;
            case 'monthly':
                next.setMonth(next.getMonth() + 1);
                break;
            default:
                return null; // No recurrence
        }

        // Stop if past end date
        if (recurrenceEndDate && next > recurrenceEndDate) {
            logger.info('Recurrence series ended', { userId, teamId, channelId });
            return null;
        }

        const delay = next.getTime() - Date.now();
        if (delay < 0) return null;

        const nextMessage = new ScheduledMessageModel({
            userId,
            teamId,
            channelId,
            content,
            scheduledFor: next,
            status: 'pending',
            recurrence,
            recurrenceEndDate,
            parentJobId,
        });

        const job = await this.messageQueue.add(
            'send-message',
            {
                dbId: nextMessage._id,
                teamId,
                channelId,
                content,
                userId,
                recurrence,
                recurrenceEndDate: recurrenceEndDate?.toISOString(),
                parentJobId,
            },
            { delay }
        );

        nextMessage.jobId = job.id;
        await nextMessage.save();

        logger.info('Next recurrence scheduled', { dbId: nextMessage._id, scheduledFor: next });
        return nextMessage;
    }

    /**
     * Cancels a scheduled message (and optionally the whole recurring series).
     */
    async cancelMessage(dbId: string, cancelSeries = false) {
        const scheduledMessage = await ScheduledMessageModel.findById(dbId);
        if (!scheduledMessage) throw new Error('Message not found');

        if (scheduledMessage.jobId) {
            const job = await this.messageQueue.getJob(scheduledMessage.jobId);
            if (job) await job.remove();
        }

        scheduledMessage.status = 'cancelled';
        await scheduledMessage.save();

        // Cancel all future occurrences in the series
        if (cancelSeries && scheduledMessage.recurrence !== 'none') {
            const seriesId = scheduledMessage.parentJobId || dbId;
            const futureMsgs = await ScheduledMessageModel.find({
                $or: [{ parentJobId: seriesId }, { _id: seriesId }],
                status: 'pending',
                _id: { $ne: dbId },
            });

            for (const msg of futureMsgs) {
                if (msg.jobId) {
                    const job = await this.messageQueue.getJob(msg.jobId);
                    if (job) await job.remove();
                }
                msg.status = 'cancelled';
                await msg.save();
            }
        }

        return scheduledMessage;
    }

    async getScheduledMessages(userId: string) {
        return ScheduledMessageModel.find({ userId }).sort({ scheduledFor: 1 });
    }
}

export const queueService = new QueueService();
