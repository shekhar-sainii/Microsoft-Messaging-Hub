import { Response } from 'express';
import { analyticsService } from './analytics.service';
import { AuthenticatedRequest } from '../../auth/authMiddleware';

export class AnalyticsController {
  async getMessageStats(req: AuthenticatedRequest, res: Response) {
    try {
      const stats = await analyticsService.getMessageStats(req.user.microsoftId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getFailureLogs(req: AuthenticatedRequest, res: Response) {
    try {
      const logs = await analyticsService.getFailureLogs(req.user.microsoftId);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAuditLogs(req: AuthenticatedRequest, res: Response) {
    try {
      const { limit, skip } = req.query;
      const logs = await analyticsService.getAuditLogs(
        req.user.microsoftId,
        Number(limit) || 10,
        Number(skip) || 0
      );
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const analyticsController = new AnalyticsController();
