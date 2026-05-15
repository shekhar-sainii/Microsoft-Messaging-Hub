import { Response } from 'express';
import { analyticsService } from './analytics.service';
import { ApiResponse } from '../../shared/ApiResponse';
import { ResponseMessages } from '../../shared/constants';
import { AuthenticatedRequest } from '../../shared/types';

export class AnalyticsController {
  async getSummaryStats(req: AuthenticatedRequest, res: Response) {
    try {
      const stats = await analyticsService.getSummaryStats(req.user?.microsoftId);
      return ApiResponse.success(res, stats, ResponseMessages.FETCHED);
    } catch (error: any) {
      return ApiResponse.error(res, error);
    }
  }

  async getMessageStats(req: AuthenticatedRequest, res: Response) {
    try {
      const stats = await analyticsService.getMessageStats(req.user?.microsoftId);
      return ApiResponse.success(res, stats, ResponseMessages.FETCHED);
    } catch (error: any) {
      return ApiResponse.error(res, error);
    }
  }

  async getFailureLogs(req: AuthenticatedRequest, res: Response) {
    try {
      const logs = await analyticsService.getFailureLogs(req.user?.microsoftId);
      return ApiResponse.success(res, logs, ResponseMessages.FETCHED);
    } catch (error: any) {
      return ApiResponse.error(res, error);
    }
  }

  async getAuditLogs(req: AuthenticatedRequest, res: Response) {
    try {
      const { limit, skip } = req.query;
      const logs = await analyticsService.getAuditLogs(
        req.user?.microsoftId,
        Number(limit) || 50,
        Number(skip) || 0
      );
      return ApiResponse.success(res, logs, ResponseMessages.FETCHED);
    } catch (error: any) {
      return ApiResponse.error(res, error);
    }
  }

  async getRateLimitStatus(req: AuthenticatedRequest, res: Response) {
    try {
        const tenantId = req.user?.tenantId || 'common';
        const result = await analyticsService.getRateLimitStatus(tenantId);
        return ApiResponse.success(res, result, ResponseMessages.FETCHED);
    } catch (error: any) {
        return ApiResponse.error(res, error);
    }
  }
}

export const analyticsController = new AnalyticsController();
