import { Response } from 'express';
import { messagesService } from './messages.service';
import { AuthenticatedRequest } from '../../shared/types';
import { AdaptiveCardUtils } from '../../utils/adaptiveCards';
import { logger } from '../../utils/logger';
import { ApiResponse } from '../../shared/ApiResponse';
import { HttpStatus, ResponseMessages } from '../../shared/constants';

export class MessagesController {
  async sendMessage(req: AuthenticatedRequest, res: Response) {
    const userId = req.user?.microsoftId;
    if (!userId) return ApiResponse.error(res, 'User identity not found', HttpStatus.UNAUTHORIZED);

    try {
      const { teamId, channelId, content, mentions, isAdaptiveCard, cardJson, subject, importance } = req.body;
      const options = { subject, importance, mentions };

      if (isAdaptiveCard) {
        const validation = AdaptiveCardUtils.validateSchema(cardJson);
        if (!validation.valid) {
          return ApiResponse.error(res, `${ResponseMessages.INVALID_CARD}: ${validation.error}`, HttpStatus.BAD_REQUEST);
        }
        const result = await messagesService.sendAdaptiveCard(req.graphClient!, teamId, channelId, cardJson, userId, options);
        return ApiResponse.success(res, result, ResponseMessages.MESSAGE_SENT);
      }

      const result = await messagesService.sendMessage(req.graphClient!, teamId, channelId, content, userId, options);
      return ApiResponse.success(res, result, ResponseMessages.MESSAGE_SENT);
    } catch (error: any) {
      logger.error('Failed to send message', { error: error.message, userId });
      return ApiResponse.error(res, error);
    }
  }

  async retryMessage(req: AuthenticatedRequest, res: Response) {
    try {
      const targetId = req.params.messageId as string;
      let targetData: any;

      const sentMsg = await messagesService.getSentMessageById(targetId);
      if (sentMsg) {
        targetData = {
          teamId: sentMsg.teamId,
          channelId: sentMsg.channelId,
          content: sentMsg.content,
          userId: sentMsg.userId,
          options: sentMsg.metadata,
          isCard: sentMsg.metadata?.type === 'adaptive_card',
          cardJson: sentMsg.metadata?.cardJson
        };
      } else {
        const { AuditLogModel } = await import('../../models/AuditLog');
        const auditLog = await AuditLogModel.findById(targetId);
        if (!auditLog || !auditLog.metadata) {
            return ApiResponse.error(res, ResponseMessages.NOT_FOUND, HttpStatus.NOT_FOUND);
        }

        targetData = {
          teamId: auditLog.metadata.teamId,
          channelId: auditLog.metadata.channelId,
          content: auditLog.metadata.content || '',
          userId: auditLog.userId,
          options: auditLog.metadata.options,
          isCard: auditLog.metadata.isCard,
          cardJson: auditLog.metadata.cardJson
        };
      }

      if (targetData.userId !== req.user?.microsoftId) {
          return ApiResponse.error(res, ResponseMessages.FORBIDDEN, HttpStatus.FORBIDDEN);
      }

      let result;
      if (targetData.isCard) {
        result = await messagesService.sendAdaptiveCard(
          req.graphClient!,
          targetData.teamId,
          targetData.channelId,
          targetData.cardJson,
          targetData.userId,
          targetData.options
        );
      } else {
        result = await messagesService.sendMessage(
          req.graphClient!,
          targetData.teamId,
          targetData.channelId,
          targetData.content,
          targetData.userId,
          targetData.options
        );
      }
      
      return ApiResponse.success(res, result, ResponseMessages.RETRY_SUCCESS);
    } catch (error: any) {
      return ApiResponse.error(res, error);
    }
  }

  async reply(req: AuthenticatedRequest, res: Response) {
    try {
      const { teamId, channelId, messageId, content } = req.body;
      const result = await messagesService.replyToMessage(req.graphClient!, teamId, channelId, messageId, content, req.user?.microsoftId);
      return ApiResponse.success(res, result, ResponseMessages.MESSAGE_SENT);
    } catch (error: any) {
      return ApiResponse.error(res, error);
    }
  }

  async deleteMessage(req: AuthenticatedRequest, res: Response) {
    try {
      const graphMsgId = req.params.graphMsgId as string;
      const { teamId, channelId } = req.query as any;
      await messagesService.deleteMessage(req.graphClient!, teamId, channelId, graphMsgId, req.user?.microsoftId);
      return ApiResponse.success(res, null, ResponseMessages.DELETED);
    } catch (error: any) {
      return ApiResponse.error(res, error);
    }
  }

  async getSentHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const { limit, skip } = req.query;
      const history = await messagesService.getSentHistory(req.user?.microsoftId, Number(limit), Number(skip));
      return ApiResponse.success(res, history, ResponseMessages.FETCHED);
    } catch (error: any) {
      return ApiResponse.error(res, error);
    }
  }

  async searchMessages(req: AuthenticatedRequest, res: Response) {
    try {
      const { q } = req.query;
      const results = await messagesService.searchHistory(req.user?.microsoftId, q as string);
      return ApiResponse.success(res, results, ResponseMessages.FETCHED);
    } catch (error: any) {
      return ApiResponse.error(res, error);
    }
  }

  async getReplies(req: AuthenticatedRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const { teamId, channelId } = req.query as any;
      const replies = await messagesService.getReplies(req.graphClient!, teamId, channelId, id);
      return ApiResponse.success(res, replies, ResponseMessages.FETCHED);
    } catch (error: any) {
      return ApiResponse.error(res, error);
    }
  }
}

export const messagesController = new MessagesController();
