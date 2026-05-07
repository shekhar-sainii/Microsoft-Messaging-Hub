import { Response } from 'express';
import { messagesService } from './messages.service';
import { AuthenticatedRequest } from '../../shared/middleware/graph.middleware';
import { AdaptiveCardUtils } from '../../utils/adaptiveCards';

export class MessagesController {
  async sendMessage(req: AuthenticatedRequest, res: Response) {
    try {
      const { teamId, channelId, content, mentions, isAdaptiveCard, cardJson, subject, importance } = req.body;
      const userId = req.user.microsoftId;

      const options = { subject, importance, mentions };

      if (isAdaptiveCard) {
        // Validate card schema and version on the backend
        const validation = AdaptiveCardUtils.validateSchema(cardJson);
        if (!validation.valid) {
          return res.status(400).json({ error: `Invalid Adaptive Card: ${validation.error}` });
        }
        const result = await messagesService.sendAdaptiveCard(req.graphClient!, teamId, channelId, cardJson, userId, options);
        return res.json(result);
      }

      const result = await messagesService.sendMessage(req.graphClient!, teamId, channelId, content, userId, options);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async retryMessage(req: AuthenticatedRequest, res: Response) {
    try {
      const messageId = req.params.messageId as string;
      const sentMsg: any = await messagesService.getSentMessageById(messageId);
      if (!sentMsg) return res.status(404).json({ error: 'Message not found' });

      // Only owner can retry
      if (sentMsg.userId !== req.user.microsoftId) return res.status(403).json({ error: 'Unauthorized' });

      const result = await messagesService.sendMessage(
        req.graphClient!,
        sentMsg.teamId,
        sentMsg.channelId,
        sentMsg.content,
        sentMsg.userId,
        sentMsg.metadata // Re-use subject, importance etc
      );
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async reply(req: AuthenticatedRequest, res: Response) {
    try {
      const teamId = req.body.teamId as string;
      const channelId = req.body.channelId as string;
      const messageId = req.body.messageId as string;
      const content = req.body.content as string;
      const userId = req.user.microsoftId;
      
      const result = await messagesService.replyToMessage(req.graphClient!, teamId, channelId, messageId, content, userId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteMessage(req: AuthenticatedRequest, res: Response) {
    try {
      const graphMsgId = req.params.graphMsgId as string;
      const teamId = req.query.teamId as string;
      const channelId = req.query.channelId as string;
      const userId = req.user.microsoftId;
      await messagesService.deleteMessage(req.graphClient!, teamId, channelId, graphMsgId, userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getSentHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const { limit, skip } = req.query;
      const history = await messagesService.getSentHistory(req.user.microsoftId, Number(limit), Number(skip));
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async searchMessages(req: AuthenticatedRequest, res: Response) {
    try {
      const { q } = req.query;
      const results = await messagesService.searchHistory(req.user.microsoftId, q as string);
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getReplies(req: AuthenticatedRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const teamId = req.query.teamId as string;
      const channelId = req.query.channelId as string;
      const replies = await messagesService.getReplies(req.graphClient!, teamId, channelId, id);
      res.json(replies);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const messagesController = new MessagesController();
