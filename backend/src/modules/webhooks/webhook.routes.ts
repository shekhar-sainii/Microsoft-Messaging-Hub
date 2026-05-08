import { Router } from 'express';
import { webhookController } from './webhook.controller';
import { authMiddleware } from '../../auth/authMiddleware';
import { graphMiddleware } from '../../shared/middleware/graph.middleware';

const router = Router();

// Internal Management Routes
router.get('/', authMiddleware, webhookController.listSubscriptions);
router.post('/subscribe', graphMiddleware, webhookController.createSubscription);
router.delete('/:id', graphMiddleware, webhookController.deleteSubscription);

// Public Webhook Callback (from Microsoft Graph)
// Requirement: must be a publicly accessible POST endpoint
router.post('/graph', webhookController.handleNotification);

export default router;
