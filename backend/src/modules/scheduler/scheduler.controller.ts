import { Response } from 'express';
import { queueService } from './queue.service';
import { ApiResponse } from '../../shared/ApiResponse';
import { ResponseMessages } from '../../shared/constants';
import { AuthenticatedRequest } from '../../shared/types';

export class SchedulerController {
  async scheduleMessage(req: AuthenticatedRequest, res: Response) {
    try {
      const { teamId, channelId, content, scheduledAt, scheduledFor, recurrence, until, recurrenceEndDate } = req.body;
      const targetDateStr = scheduledAt || scheduledFor;
      const untilDateStr = until || recurrenceEndDate;

      if (!targetDateStr) {
        return ApiResponse.error(res, new Error('Target date (scheduledFor) is required'));
      }

      const result = await queueService.scheduleMessage(
        req.user?.microsoftId,
        teamId,
        channelId,
        content,
        new Date(targetDateStr),
        recurrence,
        untilDateStr ? new Date(untilDateStr) : undefined
      );
      return ApiResponse.success(res, result, ResponseMessages.CREATED);
    } catch (error: any) {
      return ApiResponse.error(res, error);
    }
  }

  async getScheduledMessages(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await queueService.getScheduledMessages(req.user?.microsoftId);
      return ApiResponse.success(res, result, ResponseMessages.FETCHED);
    } catch (error: any) {
      return ApiResponse.error(res, error);
    }
  }

  async cancelMessage(req: AuthenticatedRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const cancelSeries = req.query.cancelSeries === 'true';
      await queueService.cancelMessage(id, cancelSeries);
      return ApiResponse.success(res, null, ResponseMessages.DELETED);
    } catch (error: any) {
      return ApiResponse.error(res, error);
    }
  }
}

export const schedulerController = new SchedulerController();
