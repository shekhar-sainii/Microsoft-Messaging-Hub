import { Router } from 'express';
import { botController } from './bot.controller';

const router = Router();

/**
 * POST /api/bot/command
 * Receives Outgoing Webhook commands from Microsoft Teams.
 * HMAC-validated via Authorization header (HMAC <base64>).
 * No auth middleware needed — validation is done inside the controller.
 */
router.post('/command', (req, res) => botController.handleCommand(req, res));

/**
 * POST /api/bot/card-action
 * Receives Adaptive Card Action.Submit callbacks from Microsoft Teams.
 */
router.post('/card-action', (req, res) => botController.handleCardAction(req, res));

export default router;
