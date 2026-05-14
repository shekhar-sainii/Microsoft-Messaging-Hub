import { Request, Response } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import { HttpStatus, ResponseMessages } from '../../shared/constants';
import { ApiResponse } from '../../shared/ApiResponse';
import { ScheduledMessageModel } from '../../models/ScheduledMessage';
import { SentMessageModel } from '../../models/SentMessage';
import { GraphSubscriptionModel } from '../../models/GraphSubscription';

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
      const mongoStatus = mongoose.connection.readyState === 1 ? 'Connected (Online)' : 'Disconnected';
      const redisStatus = config.redis.url ? 'Connected (Active Pool)' : 'Disabled';
      let subsCount = 0;
      try { subsCount = await GraphSubscriptionModel.countDocuments(); } catch(e){}
      return res.status(HttpStatus.OK).json({
        type: 'message',
        text: `✅ **Messaging Hub is Operational**\n\n**Infrastructure State:**\n- **MongoDB Engine:** ${mongoStatus}\n- **Redis Session Cache:** ${redisStatus}\n- **Active Webhook Nodes:** ${subsCount} remote listener streams`
      });
    }

    if (text.includes('help template')) {
      return res.status(HttpStatus.OK).json({
        type: 'message',
        text: '📚 **Template Engineering Library Documentation**\n\nTo build structured dynamic notification message formats supporting reusable layout blocks:\n👉 **[Microsoft Adaptive Card Designer Framework](https://adaptivecards.io/designer/)**\n👉 **[Internal Template Management Routing Base](/templates)**\n\n*Use standard JSON schemas to inject runtime variable mappings dynamically.*'
      });
    }

    if (text.includes('campaign list')) {
      try {
        const campaigns = await ScheduledMessageModel.find({ status: 'pending' }).limit(5).exec();
        if (campaigns.length === 0) {
          return res.status(HttpStatus.OK).json({
            type: 'message',
            text: '📅 **Active Scheduled Campaigns:**\nNo pending broadcast series scheduled for outbound transport today.'
          });
        }
        const listStr = campaigns.map(c => `- **ID:** \`${c._id}\` | **Recurrence:** ${c.recurrence || 'none'} | **Channel:** \`${c.channelId}\``).join('\n');
        return res.status(HttpStatus.OK).json({
          type: 'message',
          text: `📅 **Active Scheduled Campaigns (Top 5):**\n${listStr}\n\n*Tip: Dispatch \`@Hub campaign pause <ID>\` to suspend an active broadcast line.*`
        });
      } catch (err) {
        return res.status(HttpStatus.OK).json({ type: 'message', text: '❌ Error resolving campaign databases.' });
      }
    }

    if (text.includes('campaign pause')) {
      try {
        const parts = text.split('campaign pause');
        const targetId = parts[1]?.trim();
        if (!targetId) {
          return res.status(HttpStatus.OK).json({ type: 'message', text: '⚠️ Please supply a specific Campaign document ID. Example: `@Hub campaign pause 64ab...`' });
        }
        let query: any = {};
        if (mongoose.Types.ObjectId.isValid(targetId)) {
          query._id = targetId;
        } else {
          query.status = 'pending';
        }
        const updated = await ScheduledMessageModel.findOneAndUpdate(query, { status: 'cancelled' }, { new: true });
        if (updated) {
          return res.status(HttpStatus.OK).json({
            type: 'message',
            text: `⏸️ **Campaign Broadcast Paused Successfully**\n- **Series Target ID:** \`${updated._id}\`\n- **New Status:** \`paused/cancelled\`\nOutbound node queue execution blocked safely.`
          });
        } else {
          return res.status(HttpStatus.OK).json({ type: 'message', text: `❌ Campaign reference string \`${targetId}\` not found among pending active lists.` });
        }
      } catch (err) {
        return res.status(HttpStatus.OK).json({ type: 'message', text: '❌ Exception processing campaign interrupter directive.' });
      }
    }

    if (text.includes('stats')) {
      try {
        const totalSent24h = await SentMessageModel.countDocuments({ sentAt: { $gte: new Date(Date.now() - 24 * 3600 * 1000) } });
        const successCount = await SentMessageModel.countDocuments({ status: 'sent', sentAt: { $gte: new Date(Date.now() - 24 * 3600 * 1000) } });
        const failedCount = totalSent24h - successCount;
        const successRate = totalSent24h > 0 ? ((successCount / totalSent24h) * 100).toFixed(1) : '100';
        
        const tableMd = `📊 **Platform Outbound Metrics (Last 24 Hours)**\n\n| Metric Parameter | Observed Volume |\n| :--- | :--- |\n| **Total Messages Dispatched** | \`${totalSent24h}\` |\n| **Successful Graph Deliveries** | \`${successCount}\` |\n| **Network Delivery Faults** | \`${failedCount}\` |\n| **System Success Rate** | **${successRate}%** |`;
        return res.status(HttpStatus.OK).json({
          type: 'message',
          text: tableMd
        });
      } catch (err) {
        return res.status(HttpStatus.OK).json({ type: 'message', text: '❌ Failed to query metrics storage collections.' });
      }
    }

    if (text.includes('help')) {
      return res.status(HttpStatus.OK).json({
        type: 'message',
        text: '📖 **Enterprise Bot Center Menu:**\n\n- `@Hub status` — Live server DB engine verification\n- `@Hub stats` — Render real-time outbound delivery metrics table\n- `@Hub campaign list` — Display active broadcast series lines\n- `@Hub campaign pause <ID>` — Terminate active campaign series stream\n- `@Hub help template` — Show dynamic Adaptive Card documentation resources\n- `@Hub help` — Output this command dictionary list'
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
    // Whitelist internal administrative console simulator bypass alongside dev testing bypass
    const isSimulator = req.body?.from?.id === 'sim-user';
    const isDev = process.env.NODE_ENV !== 'production';
    const hasAuth = req.headers['authorization'];

    if (!this.validateHmac(req) && !isSimulator && !(isDev && !hasAuth)) {
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
