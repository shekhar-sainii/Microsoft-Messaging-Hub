import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { CryptoUtils } from '../../utils/crypto.utils';
import { socketService } from '../../services/socket.service';
import { webhookService } from './webhook.service';
import { ApiResponse } from '../../shared/ApiResponse';
import { HttpStatus, ResponseMessages } from '../../shared/constants';
import { AuthenticatedRequest } from '../../shared/types';

export class WebhookController {
  /**
   * Handles the validation handshake and incoming notifications from Graph.
   */
  async handleNotification(req: Request, res: Response) {
    const validationToken = req.query.validationToken as string;
    if (validationToken) {
      return res.status(200).set('Content-Type', 'text/plain').send(validationToken);
    }

    const notifications = req.body.value;
    if (!notifications || !Array.isArray(notifications)) {
      return res.status(202).send();
    }

    res.status(202).send();

    for (const notification of notifications) {
      try {
        if (notification.clientState !== process.env.WEBHOOK_CLIENT_STATE) continue;

        let resourceData = notification.resourceData;
        if (notification.encryptedContent) {
          const encryptedContent = notification.encryptedContent;
          const symmetricKey = CryptoUtils.decryptSymmetricKey(encryptedContent.dataKey);
          resourceData = CryptoUtils.decryptPayload(encryptedContent.data, symmetricKey);
        }

        if (resourceData) {
          const channelId = resourceData.id || notification.resource.split('/').pop();
          socketService.emitToChannel(channelId, 'message:reply', resourceData);
        }
      } catch (err) {
        logger.error('Failed to process notification', err);
      }
    }
  }

  // Management Methods
  async createSubscription(req: AuthenticatedRequest, res: Response) {
    try {
        const tenantId = req.user?.tenantId;
        if (!tenantId) throw new Error('Tenant ID not found in session');
        
        const result = await webhookService.createSubscription(req.graphClient!, tenantId);
        return ApiResponse.success(res, result, ResponseMessages.CREATED, HttpStatus.CREATED);
    } catch (error: any) {
        return ApiResponse.error(res, error);
    }
  }

  async listSubscriptions(req: Request, res: Response) {
    try {
        const result = await webhookService.listSubscriptions();
        return ApiResponse.success(res, result, ResponseMessages.FETCHED);
    } catch (error: any) {
        return ApiResponse.error(res, error);
    }
  }

  async deleteSubscription(req: AuthenticatedRequest, res: Response) {
    try {
        const id = req.params.id;
        if (typeof id !== 'string') throw new Error('Invalid subscription ID');
        
        await webhookService.deleteSubscription(req.graphClient!, id);
        return ApiResponse.success(res, null, ResponseMessages.DELETED);
    } catch (error: any) {
        return ApiResponse.error(res, error);
    }
  }
}

export const webhookController = new WebhookController();
