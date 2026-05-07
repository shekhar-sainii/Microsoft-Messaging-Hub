import { Client } from '@microsoft/microsoft-graph-client';
import SentMessageModel from '../../models/SentMessage';
import { AuditLogModel } from '../../models/AuditLog';
import { logger } from '../../utils/logger';

export interface Mention {
  id: number;
  mentionText: string;
  mentioned: {
    user?: {
      displayName: string;
      id: string;
    };
    conversation?: {
      id: string;
      displayName: string;
      conversationIdentityType: string;
    };
  };
}

export interface SendOptions {
  subject?: string;
  importance?: 'normal' | 'high' | 'urgent';
  mentions?: Mention[];
}

export class MessagesService {
  /**
   * Sends a message and records it in the local DB and audit log.
   */
  async sendMessage(
    client: Client,
    teamId: string,
    channelId: string,
    content: string,
    userId: string,
    options: SendOptions = {}
  ) {
    const payload: any = {
      body: {
        contentType: 'html',
        content: content,
      },
      importance: options.importance || 'normal',
    };

    if (options.subject) {
      payload.subject = options.subject;
    }

    if (options.mentions && options.mentions.length > 0) {
      payload.mentions = options.mentions.map((m, index) => ({
        id: index,
        mentionText: m.mentionText,
        mentioned: m.mentioned,
      }));
    }

    try {
      const graphRes = await client.api(`/teams/${teamId}/channels/${channelId}/messages`).post(payload);
      
      // Save to history
      await SentMessageModel.create({
          messageId: graphRes.id,
          teamId,
          channelId,
          userId,
          status: 'sent',
          metadata: {
            subject: options.subject,
            importance: options.importance,
            hasMentions: !!options.mentions?.length
          }
      });

      // Audit log entry
      await AuditLogModel.create({
        eventType: 'message_sent',
        details: `Message sent to channel ${channelId} in team ${teamId}`,
        status: 'success',
        userId,
        metadata: { graphId: graphRes.id, subject: options.subject }
      });

      return graphRes;
    } catch (error: any) {
      logger.error('Failed to send message', { error: error.message, teamId, channelId });
      
      await AuditLogModel.create({
        eventType: 'message_failed',
        details: `Failed to send message: ${error.message}`,
        status: 'failure',
        userId,
        metadata: { teamId, channelId }
      });
      
      throw error;
    }
  }

  async sendAdaptiveCard(
    client: Client,
    teamId: string,
    channelId: string,
    cardJson: any,
    userId: string,
    options: SendOptions = {}
  ) {
    // CRITICAL: The content field MUST be a JSON string, not an object.
    const cardContent = typeof cardJson === 'string' ? cardJson : JSON.stringify(cardJson);

    const payload: any = {
      body: {
        contentType: 'html',
        content: `<attachment id="adaptiveCardAttachment"></attachment>`,
      },
      attachments: [
        {
          id: 'adaptiveCardAttachment',
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: cardContent,
        },
      ],
      importance: options.importance || 'normal',
    };

    if (options.subject) {
      payload.subject = options.subject;
    }

    try {
      const graphRes = await client.api(`/teams/${teamId}/channels/${channelId}/messages`).post(payload);
      
      await SentMessageModel.create({
          messageId: graphRes.id,
          teamId,
          channelId,
          userId,
          status: 'sent',
          metadata: { type: 'adaptive_card', subject: options.subject }
      });

      await AuditLogModel.create({
        eventType: 'message_sent',
        details: `Adaptive card sent to channel ${channelId}`,
        status: 'success',
        userId,
        metadata: { graphId: graphRes.id, isCard: true }
      });

      return graphRes;
    } catch (error: any) {
      logger.error('Failed to send adaptive card', { error: error.message });
      
      await AuditLogModel.create({
        eventType: 'message_failed',
        details: `Failed to send adaptive card: ${error.message}`,
        status: 'failure',
        userId,
      });

      throw error;
    }
  }

  async replyToMessage(
    client: Client,
    teamId: string,
    channelId: string,
    messageId: string,
    content: string,
    userId: string
  ) {
    const payload = {
      body: {
        contentType: 'html',
        content: content,
      },
    };

    try {
      const graphRes = await client.api(`/teams/${teamId}/channels/${channelId}/messages/${messageId}/replies`).post(payload);
      
      await AuditLogModel.create({
        eventType: 'message_reply',
        details: `Replied to message ${messageId}`,
        status: 'success',
        userId,
      });

      return graphRes;
    } catch (error: any) {
      logger.error('Failed to reply to message', { error: error.message });
      throw error;
    }
  }

  async deleteMessage(client: Client, teamId: string, channelId: string, messageId: string, userId: string) {
    await client.api(`/teams/${teamId}/channels/${channelId}/messages/${messageId}`).delete();
    await SentMessageModel.deleteOne({ messageId });
    
    await AuditLogModel.create({
      eventType: 'message_deleted',
      details: `Deleted message ${messageId}`,
      status: 'success',
      userId,
    });
  }

  async getReplies(client: Client, teamId: string, channelId: string, messageId: string) {
    return client.api(`/teams/${teamId}/channels/${channelId}/messages/${messageId}/replies`).get();
  }

  async getSentMessageById(id: string) {
    return SentMessageModel.findById(id);
  }

  async getSentHistory(userId: string, limit = 50, skip = 0) {
    return SentMessageModel.find({ userId }).sort({ createdAt: -1 }).limit(limit).skip(skip);
  }

  async searchHistory(userId: string, query: string) {
    return SentMessageModel.find({ 
        userId, 
        content: { $regex: query, $options: 'i' } 
    }).sort({ createdAt: -1 });
  }
}

export const messagesService = new MessagesService();
