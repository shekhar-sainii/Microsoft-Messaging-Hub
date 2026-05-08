import { Client } from '@microsoft/microsoft-graph-client';
import { logger } from '../../utils/logger';
import { messageRepository } from './message.repository';
import { auditRepository } from '../analytics/audit.repository';
import { RateLimiter } from '../../utils/rateLimiter';

export interface Mention {
  id: number;
  mentionText: string;
  mentioned: {
    user?: { displayName: string; id: string; };
    conversation?: { id: string; displayName: string; conversationIdentityType: string; };
  };
}

export interface SendOptions {
  subject?: string;
  importance?: 'normal' | 'high' | 'urgent';
  mentions?: Mention[];
}

export class MessagesService {
  async sendMessage(client: Client, teamId: string, channelId: string, content: string, userId: string, options: SendOptions = {}) {
    return RateLimiter.throttle(userId, async () => {
        const payload: any = {
          body: { contentType: 'html', content },
          importance: options.importance || 'normal',
        };

        if (options.subject) payload.subject = options.subject;
        if (options.mentions?.length) {
          payload.mentions = options.mentions.map((m, index) => ({
            id: index, mentionText: m.mentionText, mentioned: m.mentioned,
          }));
        }

        try {
          const graphRes = await client.api(`/teams/${teamId}/channels/${channelId}/messages`).post(payload);
          
          await messageRepository.create({
              messageId: graphRes.id, teamId, channelId, userId, status: 'sent',
              content,
              metadata: { subject: options.subject, importance: options.importance, hasMentions: !!options.mentions?.length }
          } as any);

          await auditRepository.log({
            eventType: 'message_sent',
            details: `Message sent to channel ${channelId} in team ${teamId}`,
            status: 'success',
            userId,
            metadata: { graphId: graphRes.id, subject: options.subject }
          });

          return graphRes;
        } catch (error: any) {
          logger.error('Failed to send message', { error: error.message, teamId, channelId });
          await auditRepository.log({
            eventType: 'message_failed',
            details: `Failed to send message: ${error.message}`,
            status: 'failure', userId,
            metadata: { teamId, channelId, content, options, error: error.message }
          });
          throw error;
        }
    });
  }

  async sendAdaptiveCard(client: Client, teamId: string, channelId: string, cardJson: any, userId: string, options: SendOptions = {}) {
    return RateLimiter.throttle(userId, async () => {
        const cardContent = typeof cardJson === 'string' ? cardJson : JSON.stringify(cardJson);
        const payload: any = {
          body: { contentType: 'html', content: `<attachment id="adaptiveCardAttachment"></attachment>` },
          attachments: [{ id: 'adaptiveCardAttachment', contentType: 'application/vnd.microsoft.card.adaptive', content: cardContent }],
          importance: options.importance || 'normal',
        };

        if (options.subject) payload.subject = options.subject;

        try {
          const graphRes = await client.api(`/teams/${teamId}/channels/${channelId}/messages`).post(payload);
          
          await messageRepository.create({
              messageId: graphRes.id, teamId, channelId, userId, status: 'sent',
              metadata: { type: 'adaptive_card', subject: options.subject, cardJson: cardJson }
          } as any);

          await auditRepository.log({
            eventType: 'message_sent',
            details: `Adaptive card sent to channel ${channelId}`,
            status: 'success', userId,
            metadata: { graphId: graphRes.id, isCard: true }
          });

          return graphRes;
        } catch (error: any) {
          logger.error('Failed to send adaptive card', { error: error.message });
          await auditRepository.log({
            eventType: 'message_failed',
            details: `Failed to send adaptive card: ${error.message}`,
            status: 'failure', userId,
            metadata: { teamId, channelId, cardJson, options, isCard: true }
          });
          throw error;
        }
    });
  }

  async replyToMessage(client: Client, teamId: string, channelId: string, messageId: string, content: string, userId: string) {
    return RateLimiter.throttle(userId, async () => {
        const payload = { body: { contentType: 'html', content } };

        try {
          const graphRes = await client.api(`/teams/${teamId}/channels/${channelId}/messages/${messageId}/replies`).post(payload);
          await auditRepository.log({ eventType: 'message_reply', details: `Replied to message ${messageId}`, status: 'success', userId });
          return graphRes;
        } catch (error: any) {
          logger.error('Failed to reply to message', { error: error.message });
          throw error;
        }
    });
  }

  async deleteMessage(client: Client, teamId: string, channelId: string, messageId: string, userId: string) {
    return RateLimiter.throttle(userId, async () => {
        await client.api(`/teams/${teamId}/channels/${channelId}/messages/${messageId}`).delete();
        await messageRepository.delete({ messageId });
        await auditRepository.log({ eventType: 'message_deleted', details: `Deleted message ${messageId}`, status: 'success', userId });
    });
  }

  async getReplies(client: Client, teamId: string, channelId: string, messageId: string) {
    return client.api(`/teams/${teamId}/channels/${channelId}/messages/${messageId}/replies`).get();
  }

  async getSentMessageById(id: string) {
    return messageRepository.findOne({ _id: id });
  }

  async getSentHistory(userId: string, limit = 50, skip = 0) {
    return messageRepository.find({ userId });
  }

  async searchHistory(userId: string, query: string) {
    return messageRepository.find({ userId, content: { $regex: query, $options: 'i' } });
  }
}

export const messagesService = new MessagesService();
