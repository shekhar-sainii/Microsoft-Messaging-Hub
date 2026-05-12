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
import { userRepository } from '../../auth/user.repository';

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
                // 1. Retrieve Delegated User Access Token to bypass Graph Application permissions restrictions
                const user = await userRepository.findByMicrosoftId(userId);
                let token: string = user?.accessToken || '';

                if (!token) {
                    logger.warn('Delegated access token missing, attempting fallback to Application token', { userId });
                    const appToken = await ClientCredentialsService.getAppToken();
                    token = appToken || '';
                }
                if (!token) throw new Error('Failed to acquire valid delegated or application authentication token');

                const client = createGraphClient(token);

                // Check if payload is an Adaptive Card JSON string
                const isCard = content && content.trim().startsWith('{') && content.includes('AdaptiveCard');

                // 2. Send the message or Adaptive Card
                if (isCard) {
                    let cardObj;
                    try {
                        cardObj = JSON.parse(content);
                    } catch {
                        cardObj = content;
                    }
                    await messagesService.sendAdaptiveCard(
                        client as any,
                        teamId,
                        channelId,
                        cardObj,
                        userId,
                        options
                    );
                } else {
                    await messagesService.sendMessage(
                        client as any,
                        teamId,
                        channelId,
                        content,
                        userId,
                        options
                    );
                }

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
