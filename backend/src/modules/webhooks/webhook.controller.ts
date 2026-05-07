import { Request, Response } from 'express';
import { webhookService } from './webhook.service';
import { AuthenticatedRequest } from '../../shared/middleware/graph.middleware';
import { cryptoUtils } from '../../utils/crypto.utils';
import { socketService } from '../../services/socket.service';

export class WebhookController {
  /**
   * Handles the Graph API validation handshake and incoming notifications.
   */
  async handleWebhook(req: Request, res: Response) {
    // 1. Handle Handshake
    const validationToken = req.query.validationToken as string;
    if (validationToken) {
      console.log('Webhook validation handshake received');
      return res.status(200).set('Content-Type', 'text/plain').send(validationToken);
    }

    // 2. Handle Notifications
    const { value } = req.body;
    if (value && Array.isArray(value)) {
      console.log(`Received ${value.length} notifications`);
      
      for (const notification of value) {
        try {
          // Verify Client State
          if (notification.clientState !== process.env.WEBHOOK_CLIENT_STATE) {
            console.warn('Invalid client state received');
            continue;
          }

          let messageData = notification.resourceData;

          // Decrypt if encrypted
          if (notification.encryptedContent) {
            console.log('Decrypting notification content...');
            const { data, dataKey, dataSignature } = notification.encryptedContent;
            
            // Decrypt symmetric key using RSA private key
            const symmetricKey = cryptoUtils.decryptSymmetricKey(dataKey);
            
            // Decrypt actual content using symmetric key
            messageData = cryptoUtils.decryptContent(data, symmetricKey);
          }

          // Process decrypted message data
          if (messageData) {
            console.log('Processed Message:', messageData.body?.content);
            
            // Emit to relevant Socket.IO channel room
            // Resource format: "teams('teamId')/channels('channelId')/messages('messageId')"
            const channelId = messageData.channelId || notification.resource.split("'")[3];
            
            // Determine event type based on changeType
            const changeType = notification.changeType;

            if (changeType === 'created') {
              // Check if it's a reply (has replyToId) or a new message
              if (messageData.replyToId) {
                // Contract event: message:reply
                socketService.emitToChannel(channelId, 'message:reply', {
                  teamId: messageData.channelIdentity?.teamId,
                  channelId,
                  reply: {
                    id: messageData.id,
                    content: messageData.body?.content,
                    from: messageData.from?.user?.displayName,
                    createdDateTime: messageData.createdDateTime,
                    replyToId: messageData.replyToId,
                  }
                });
              } else {
                // New top-level message
                socketService.emitToChannel(channelId, 'message:new', {
                  id: messageData.id,
                  content: messageData.body?.content,
                  from: messageData.from?.user?.displayName,
                  createdDateTime: messageData.createdDateTime,
                });
              }
            } else if (changeType === 'updated') {
              // Contract event: message:updated
              socketService.emitToChannel(channelId, 'message:updated', {
                graphMsgId: messageData.id,
                updatedContent: messageData.body?.content,
              });
            }
          }
        } catch (error) {
          console.error('Error processing notification:', error);
        }
      }
    }

    // Always return 202 Accepted immediately
    res.status(202).send();
  }

  async createSubscription(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId || 'common';
      const subscription = await webhookService.createSubscription(req.graphClient!, tenantId);
      res.json(subscription);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async listSubscriptions(req: Request, res: Response) {
    try {
      const subs = await webhookService.listSubscriptions();
      res.json(subs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteSubscription(req: AuthenticatedRequest, res: Response) {
    try {
      const id = req.params.id as string;
      await webhookService.deleteSubscription(req.graphClient!, id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const webhookController = new WebhookController();
