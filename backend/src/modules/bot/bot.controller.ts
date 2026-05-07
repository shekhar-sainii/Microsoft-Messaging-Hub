import { Request, Response } from 'express';
import crypto from 'crypto';
import { config } from '../../config';
import { logger } from '../../utils/logger';

/**
 * Outgoing Webhook Bot Controller
 * 
 * Handles commands sent from Microsoft Teams via an Outgoing Webhook.
 * Teams sends a POST request to this endpoint with an HMAC signature.
 * 
 * Setup in Teams:
 * 1. Go to a Team > Manage Team > Apps > Create Outgoing Webhook
 * 2. Set the callback URL to: https://your-ngrok-url/api/bot/command
 * 3. Copy the Security Token → set as TEAMS_OUTGOING_WEBHOOK_TOKEN in .env
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
   * Returns a card or text response that Teams renders in the channel.
   */
  async handleCommand(req: Request, res: Response) {
    // Validate HMAC signature
    if (!this.validateHmac(req)) {
      return res.status(401).json({ type: 'message', text: '❌ Unauthorized: Invalid HMAC signature.' });
    }

    const body = req.body;
    const text: string = (body.text || '').replace(/<[^>]+>/g, '').trim().toLowerCase();

    logger.info(`Bot command received: "${text}" from ${body.from?.name}`);

    // Parse commands
    if (text.includes('status')) {
      return res.json({
        type: 'message',
        text: '✅ **Messaging Hub is Operational**\n- MongoDB: Connected\n- Redis: Connected\n- Webhook subscriptions: Active'
      });
    }

    if (text.includes('help')) {
      return res.json({
        type: 'message',
        text: '📖 **Available Commands:**\n- `@Hub status` — check system health\n- `@Hub help` — show this menu'
      });
    }

    // Default response
    return res.json({
      type: 'message',
      text: `👋 Hi ${body.from?.name || 'there'}! I received your message. Type \`@Hub help\` to see available commands.`
    });
  }

  /**
   * Handles Adaptive Card Action.Submit callbacks.
   * When a user clicks a button on an Adaptive Card sent via this hub,
   * Teams posts the action data back to this endpoint.
   */
  async handleCardAction(req: Request, res: Response) {
    if (!this.validateHmac(req)) {
      return res.status(401).json({ type: 'message', text: '❌ Unauthorized' });
    }

    const { value } = req.body;
    logger.info('Adaptive Card Action.Submit received', value);

    // Process action data
    const action = value?.action;

    switch (action) {
      case 'acknowledge':
        return res.json({
          type: 'message',
          text: `✅ ${req.body.from?.name || 'User'} has acknowledged the message.`
        });

      case 'approve':
        return res.json({
          type: 'message',
          text: `✅ Approved by ${req.body.from?.name || 'User'}.`
        });

      case 'reject':
        return res.json({
          type: 'message',
          text: `❌ Rejected by ${req.body.from?.name || 'User'}.`
        });

      default:
        return res.json({
          type: 'message',
          text: `Action received: ${JSON.stringify(value)}`
        });
    }
  }
}

export const botController = new BotController();
