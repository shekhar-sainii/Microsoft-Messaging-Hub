import { Worker, Job } from 'bullmq';
import { redisConnection } from '../../../config/redis';
import ScheduledMessageModel from '../../../models/ScheduledMessage';
import { ClientCredentialsService } from '../../../auth/clientCredentials';
import { createGraphClient } from '../../../config/graphClient';
import { messagesService } from '../../messages/messages.service';
import { socketService } from '../../../services/socket.service';
import { queueService } from '../queue.service';
import { logger } from '../../../utils/logger';
import type { RecurrenceType } from '../../../models/ScheduledMessage';

export const startMessageWorker = () => {
    const worker = new Worker(
        'message-scheduler',
        async (job: Job) => {
            const {
                dbId,
                teamId,
                channelId,
                content,
                userId,
                options,
                recurrence,
                recurrenceEndDate,
                parentJobId,
            } = job.data;

            logger.info('Processing scheduled message job', { jobId: job.id, dbId });

            try {
                // 1. Get application-level token (client credentials)
                const token = await ClientCredentialsService.getAppToken();
                if (!token) throw new Error('Failed to acquire application token');

                const client = createGraphClient(token);

                // 2. Send the message
                await messagesService.sendMessage(
                    client as any,
                    teamId,
                    channelId,
                    content,
                    userId,
                    options
                );

                // 3. Update DB status
                const dbMsg = await ScheduledMessageModel.findByIdAndUpdate(
                    dbId,
                    { status: 'sent', error: null },
                    { new: true }
                );

                // 4. Notify UI — contract event: schedule:sent
                socketService.emitToUser(userId, 'schedule:sent', {
                    scheduledMsgId: dbId,
                    sentAt: new Date(),
                });

                // 5. Schedule next recurrence if applicable
                if (recurrence && recurrence !== 'none' && dbMsg) {
                    await queueService.scheduleNextRecurrence(
                        userId,
                        teamId,
                        channelId,
                        content,
                        dbMsg.scheduledFor,
                        recurrence as RecurrenceType,
                        recurrenceEndDate ? new Date(recurrenceEndDate) : undefined,
                        parentJobId || dbId
                    );
                }

                logger.info('Successfully delivered scheduled message', { dbId });
            } catch (error: any) {
                // Handle Graph rate limiting — log Retry-After for observability
                if (error.response?.status === 429) {
                    const retryAfter = parseInt(
                        error.response.headers['retry-after'] || '60',
                        10
                    );
                    logger.warn(`Scheduler rate limited. BullMQ will retry. Retry-After: ${retryAfter}s`, {
                        dbId,
                    });
                }

                logger.error('Scheduled delivery failed', {
                    jobId: job.id,
                    error: error.message,
                });

                // Update DB
                await ScheduledMessageModel.findByIdAndUpdate(dbId, {
                    status: 'failed',
                    error: error.message,
                });

                // Notify UI — contract event: schedule:failed
                socketService.emitToUser(userId, 'schedule:failed', {
                    scheduledMsgId: dbId,
                    error: error.message,
                });

                throw error; // Re-throw for BullMQ retry logic
            }
        },
        { connection: redisConnection }
    );

    return worker;
};
