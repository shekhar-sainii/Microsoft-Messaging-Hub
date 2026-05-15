import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authMiddleware } from '../../auth/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/summary', analyticsController.getSummaryStats);
router.get('/messages', analyticsController.getMessageStats);
router.get('/failures', analyticsController.getFailureLogs);
router.get('/audit', analyticsController.getAuditLogs);
router.get('/ratelimit', analyticsController.getRateLimitStatus);

export default router;
