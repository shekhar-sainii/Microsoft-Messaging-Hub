import { Request, Response } from 'express';
import crypto from 'crypto';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import { HttpStatus, ResponseMessages } from '../../shared/constants';
import { ApiResponse } from '../../shared/ApiResponse';

/**
 * Outgoing Webhook Bot Controller
 */
export class BotController {
  /**
   * Validates the Teams HMAC signature on incoming webhook requests.
   */
  private validateHmac(req: Request): boolean {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('HMAC ')) return false;

    const receivedHmac = authHeader.slice(5);
    const token = config.teamsWebhookToken;
    if (!token) {
      logger.warn('TEAMS_OUTGOING_WEBHOOK_TOKEN is not configured');
      return false;
    }

    const msgBuf = Buffer.from(JSON.stringify(req.body), 'utf8');
    const keyBuf = Buffer.from(token, 'base64');
    const expectedHmac = crypto
      .createHmac('sha256', keyBuf)
      .update(msgBuf)
      .digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(receivedHmac, 'base64'),
      Buffer.from(expectedHmac, 'base64')
    );
  }

  /**
   * Receives commands from Teams Outgoing Webhook.
   */
  async handleCommand(req: Request, res: Response) {
    // Whitelist internal administrative console simulator bypass alongside dev testing bypass
    const isSimulator = req.body?.from?.id === 'sim-user';
    const isDev = process.env.NODE_ENV !== 'production';
    const hasAuth = req.headers['authorization'];

    if (!this.validateHmac(req) && !isSimulator && !(isDev && !hasAuth)) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ type: 'message', text: '❌ Unauthorized: Invalid HMAC signature.' });
    }

    const body = req.body;
    const text: string = (body.text || '').replace(/<[^>]+>/g, '').trim().toLowerCase();

    logger.info(`Bot command received: "${text}" from ${body.from?.name}`);

    if (text.includes('status')) {
      return res.status(HttpStatus.OK).json({
        type: 'message',
        text: '✅ **Messaging Hub is Operational**\n- MongoDB: Connected\n- Redis: Connected\n- Webhook subscriptions: Active'
      });
    }

    if (text.includes('help')) {
      return res.status(HttpStatus.OK).json({
        type: 'message',
        text: '📖 **Available Commands:**\n- `@Hub status` — check system health\n- `@Hub help` — show this menu'
      });
    }

    return res.status(HttpStatus.OK).json({
      type: 'message',
      text: `👋 Hi ${body.from?.name || 'there'}! I received your message. Type \`@Hub help\` to see available commands.`
    });
  }

  /**
   * Handles Adaptive Card Action.Submit callbacks.
   */
  async handleCardAction(req: Request, res: Response) {
    // Development Bypass for local testing
    const isDev = process.env.NODE_ENV !== 'production';
    const hasAuth = req.headers['authorization'];

    if (!this.validateHmac(req) && !(isDev && !hasAuth)) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ type: 'message', text: '❌ Unauthorized' });
    }

    const { value } = req.body;
    logger.info('Adaptive Card Action.Submit received', value);

    const action = value?.action;

    switch (action) {
      case 'acknowledge':
        return res.status(HttpStatus.OK).json({
          type: 'message',
          text: `✅ ${req.body.from?.name || 'User'} has acknowledged the message.`
        });

      case 'approve':
        return res.status(HttpStatus.OK).json({
          type: 'message',
          text: `✅ Approved by ${req.body.from?.name || 'User'}.`
        });

      case 'reject':
        return res.status(HttpStatus.OK).json({
          type: 'message',
          text: `❌ Rejected by ${req.body.from?.name || 'User'}.`
        });

      default:
        return res.status(HttpStatus.OK).json({
          type: 'message',
          text: `Action received: ${JSON.stringify(value)}`
        });
    }
  }

  /**
   * Management Methods: Retrieve active Bot parameters.
   */
  async getConfig(_req: Request, res: Response) {
    try {
      const isConfigured = !!config.teamsWebhookToken;
      const maskedToken = isConfigured ? `${config.teamsWebhookToken.slice(0, 4)}...${config.teamsWebhookToken.slice(-4)}` : '';
      return ApiResponse.success(res, {
        isConfigured,
        maskedToken,
        webhookUrl: config.webhook.url
      }, ResponseMessages.FETCHED);
    } catch (error: any) {
      return ApiResponse.error(res, error);
    }
  }

  /**
   * Management Methods: Update active Bot parameters dynamically.
   */
  async updateConfig(req: Request, res: Response) {
    try {
      const { token } = req.body;
      if (typeof token !== 'string') {
        throw new Error('Outgoing Webhook Token must be provided as a string');
      }

      config.teamsWebhookToken = token.trim();
      logger.info('Microsoft Teams Outgoing Webhook token updated dynamically');

      return ApiResponse.success(res, {
        isConfigured: !!config.teamsWebhookToken,
        maskedToken: config.teamsWebhookToken ? `${config.teamsWebhookToken.slice(0, 4)}...${config.teamsWebhookToken.slice(-4)}` : ''
      }, ResponseMessages.UPDATED);
    } catch (error: any) {
      return ApiResponse.error(res, error);
    }
  }
}

export const botController = new BotController();
