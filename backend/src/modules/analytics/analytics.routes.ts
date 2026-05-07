import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authMiddleware } from '../../auth/authMiddleware';

const router = Router();

router.use(authMiddleware);

// Admin Analytics
router.get('/messages', analyticsController.getMessageStats);
router.get('/failures', analyticsController.getFailureLogs);

// Audit log — also accessible at /api/audit (mounted separately in index.ts)
router.get('/audit', analyticsController.getAuditLogs);

export default router;
