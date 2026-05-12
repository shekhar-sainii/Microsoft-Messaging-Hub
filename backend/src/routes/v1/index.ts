import { Router } from 'express';
import authRoutes from '../../modules/auth/auth.routes';
import teamsRoutes from '../../modules/teams/teams.routes';
import messagesRoutes from '../../modules/messages/messages.routes';
import webhookRoutes from '../../modules/webhooks/webhook.routes';
import schedulerRoutes from '../../modules/scheduler/scheduler.routes';
import templateRoutes from '../../modules/templates/template.routes';
import analyticsRoutes from '../../modules/analytics/analytics.routes';
import favouriteRoutes from '../../modules/favourites/favourite.routes';
import botRoutes from '../../modules/bot/bot.routes';
import userRoutes from '../../modules/users/user.routes';

const router = Router();

/**
 * V1 Route Registration
 */
router.use('/auth', authRoutes);
router.use('/teams', teamsRoutes);
router.use('/messages', messagesRoutes);
router.use('/schedule', schedulerRoutes);
router.use('/templates', templateRoutes);
router.use('/subscriptions', webhookRoutes);
router.use('/webhook', webhookRoutes); // Alias for compatibility
router.use('/analytics', analyticsRoutes);
router.use('/audit', analyticsRoutes);
router.use('/favourites', favouriteRoutes);
router.use('/bot', botRoutes);
router.use('/users', userRoutes);

export default router;
