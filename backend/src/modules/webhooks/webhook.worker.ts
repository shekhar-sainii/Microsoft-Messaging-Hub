import { Queue, Worker, Job } from 'bullmq';
import { redisConnection } from '../../config/redis';
import { webhookService } from '../webhooks/webhook.service';
import { ClientCredentialsService } from '../../auth/clientCredentials';
import { createGraphClient } from '../../config/graphClient';
import { logger } from '../../utils/logger';
import { socketService } from '../../services/socket.service';

/**
 * Webhook Renewal Queue
 */
export const subscriptionQueue = new Queue('subscription-renewal', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 10000 },
    removeOnComplete: true
  }
});

/**
 * Worker to process subscription renewals
 */
export const startWebhookWorker = () => {
  const worker = new Worker('subscription-renewal', async (job: Job) => {
    const { subscriptionId, tenantId, userId } = job.data;
    logger.info(`Processing renewal for subscription ${subscriptionId}`);

    try {
      const token = await ClientCredentialsService.getAppToken();
      if (!token) throw new Error('Failed to acquire app token for renewal');

      const client = createGraphClient(token);
      const result = await webhookService.renewSubscription(client as any, subscriptionId);

      // Schedule next renewal (5 minutes before new expiry)
      const newExpiry = new Date(result.expirationDateTime);
      const delay = (newExpiry.getTime() - Date.now()) - (5 * 60 * 1000);
      
      await subscriptionQueue.add('renew-subscription', job.data, { delay });

      logger.info(`Successfully renewed subscription ${subscriptionId}. Next renewal in ${delay}ms`);
      
      if (userId) {
        socketService.emitToUser(userId, 'subscription:renewed', {
          subscriptionId,
          newExpiry: result.expirationDateTime
        });
      }
    } catch (error: any) {
      logger.error(`Renewal failed for ${subscriptionId}`, { error: error.message });
      
      if (userId) {
        socketService.emitToUser(userId, 'subscription:expired', { subscriptionId });
      }
      
      throw error;
    }
  }, { connection: redisConnection });

  return worker;
};
