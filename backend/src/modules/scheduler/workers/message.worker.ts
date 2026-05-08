import { Worker, Job } from 'bullmq';
import { redisConnection } from '../../../config/redis';
import { ClientCredentialsService } from '../../../auth/clientCredentials';
import { createGraphClient } from '../../../config/graphClient';
import { messagesService } from '../../messages/messages.service';
import { socketService } from '../../../services/socket.service';
import { queueService } from '../queue.service';
import { logger } from '../../../utils/logger';
import type { RecurrenceType } from '../../../models/ScheduledMessage';
import { schedulerRepository } from '../scheduler.repository';

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

                // 3. Update DB status via modular repository
                const dbMsg = await schedulerRepository.updateStatus(dbId, 'sent');

                // 4. Notify UI
                socketService.emitToUser(userId, 'schedule:sent', {
                    scheduledMsgId: dbId,
                    sentAt: new Date(),
                });

                // 5. Schedule next recurrence
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
                if (error.response?.status === 429) {
                    logger.warn(`Scheduler rate limited. BullMQ will retry.`, { dbId });
                }

                logger.error('Scheduled delivery failed', { jobId: job.id, error: error.message });

                // Update DB via modular repository
                await schedulerRepository.updateStatus(dbId, 'failed', error.message);

                // Notify UI
                socketService.emitToUser(userId, 'schedule:failed', {
                    scheduledMsgId: dbId,
                    error: error.message,
                });

                throw error;
            }
        },
        { connection: redisConnection }
    );

    return worker;
};
