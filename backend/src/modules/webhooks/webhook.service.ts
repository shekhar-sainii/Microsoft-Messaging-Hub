import { Client } from '@microsoft/microsoft-graph-client';
import { webhookRepository } from './webhook.repository';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import { CryptoUtils } from '../../utils/crypto.utils';
import { ClientCredentialsService } from '../../auth/clientCredentials';
import { createGraphClient } from '../../config/graphClient';

export class WebhookService {
  async createSubscription(_userClient: Client, tenantId: string) {
    const expirationDateTime = new Date();
    expirationDateTime.setHours(expirationDateTime.getHours() + 1);

    const publicKey = CryptoUtils.getPublicKeyBase64();

    // MUST use App-only token for tenant-wide channel messages
    const appToken = await ClientCredentialsService.getAppToken();
    if (!appToken) throw new Error('Could not obtain application token for subscription');
    const appClient = createGraphClient(appToken);

    // Robust absolute domain fallback wrapper: Microsoft Graph strictly rejects relative URLs
    // or unroutable endpoints. If WEBHOOK_URL is missing from cloud container definitions,
    // default securely to the established production live backend instance.
    let rootTargetDomain = config.webhook.url || process.env.WEBHOOK_URL || '';
    if (!rootTargetDomain || !rootTargetDomain.startsWith('http')) {
        rootTargetDomain = 'https://microsoft-messaging-hub.onrender.com';
    }
    const normalizedBase = rootTargetDomain.replace(/\/+$/, '').replace(/\/api(\/webhook)?$/, '');
    const notificationTargetUrl = `${normalizedBase}/api/webhook/graph`;

    const subscriptionPayload = {
      changeType: 'created,updated',
      notificationUrl: notificationTargetUrl,
      resource: '/teams/getAllMessages',
      expirationDateTime: expirationDateTime.toISOString(),
      clientState: config.webhook.clientState,
      includeResourceData: true,
      encryptionCertificate: publicKey,
      encryptionCertificateId: 'hub-cert-001',
    };

    const response = await appClient.api('/subscriptions').post(subscriptionPayload);
    
    return webhookRepository.create({
      subscriptionId: response.id,
      resource: response.resource,
      expirationDateTime: new Date(response.expirationDateTime),
      tenantId,
      active: true
    } as any);
  }

  async listSubscriptions() {
    return webhookRepository.findActive();
  }

  async deleteSubscription(client: Client, id: string) {
    const sub = await webhookRepository.findBySubscriptionId(id);
    if (sub) {
        await client.api(`/subscriptions/${id}`).delete();
        await webhookRepository.delete({ subscriptionId: id });
    }
  }

  async renewSubscription(client: Client, subscriptionId: string) {
    const expirationDateTime = new Date();
    expirationDateTime.setHours(expirationDateTime.getHours() + 1);

    await client.api(`/subscriptions/${subscriptionId}`).patch({
        expirationDateTime: expirationDateTime.toISOString()
    });

    return webhookRepository.update({ subscriptionId }, {
        expirationDateTime
    });
  }

  async renewSubscriptions(client: Client) {
    const activeSubs = await webhookRepository.findActive();
    for (const sub of activeSubs) {
      try {
        await this.renewSubscription(client, sub.subscriptionId);
      } catch (err) {
        logger.error(`Failed to renew subscription ${sub.subscriptionId}`, err);
      }
    }
  }

  /**
   * Catch up on missed notifications using Delta Queries.
   */
  async catchUpDelta(client: Client, subscriptionId: string) {
    const sub = await webhookRepository.findBySubscriptionId(subscriptionId);
    if (!sub || !sub.active) return;

    // Microsoft Graph explicitly defines /teams/getAllMessages as a non-composable function.
    // Consequently, appending nested path segments like /delta is structurally rejected by the SDK.
    if (sub.resource && sub.resource.includes('getAllMessages')) {
        logger.info(`Subscription ${subscriptionId} targets non-composable stream hub; delta catches sync natively via active webhooks.`);
        return;
    }

    let url = sub.deltaLink || `${sub.resource}/delta`;
    
    try {
        logger.info(`Starting delta catch-up for ${subscriptionId}`);
        
        let hasMore = true;
        while (hasMore) {
            const result = await client.api(url).get();
            
            if (result.value && result.value.length > 0) {
                logger.info(`Caught up on ${result.value.length} missed notifications`);
            }

            if (result['@odata.deltaLink']) {
                await webhookRepository.update({ subscriptionId }, { deltaLink: result['@odata.deltaLink'] });
                hasMore = false;
            } else if (result['@odata.nextLink']) {
                url = result['@odata.nextLink'];
            } else {
                hasMore = false;
            }
        }
    } catch (err) {
        logger.error(`Delta catch-up failed for ${subscriptionId}`, err);
    }
  }

  /**
   * Bootstraps delta catch-up for all active subscriptions on server start.
   */
  async bootstrapDeltaCatchup() {
    const activeSubs = await webhookRepository.findActive();
    if (activeSubs.length === 0) return;

    logger.info(`Bootstrapping delta catch-up for ${activeSubs.length} subscriptions`);

    // We use an app-only token for catch-up
    const token = await ClientCredentialsService.getAppToken();
    if (!token) {
        logger.error('Failed to get app token for delta catch-up');
        return;
    }

    const client = createGraphClient(token);

    for (const sub of activeSubs) {
        await this.catchUpDelta(client, sub.subscriptionId);
    }
  }
}

export const webhookService = new WebhookService();
