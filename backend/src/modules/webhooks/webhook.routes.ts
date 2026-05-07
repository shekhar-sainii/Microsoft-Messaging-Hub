import { Router } from 'express';
import { webhookController } from './webhook.controller';
import { graphMiddleware } from '../../shared/middleware/graph.middleware';

const router = Router();

// Public receiver (mounted at /webhook/graph)
router.post('/graph', webhookController.handleWebhook);

// Protected Subscription management (mounted at /api/subscriptions)
router.get('/', graphMiddleware, webhookController.listSubscriptions);
router.post('/', graphMiddleware, webhookController.createSubscription);
router.delete('/:id', graphMiddleware, webhookController.deleteSubscription);

export default router;
