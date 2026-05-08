import { Router } from 'express';
import { schedulerController } from './scheduler.controller';
import { authMiddleware } from '../../auth/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.post('/', schedulerController.scheduleMessage);
router.get('/', schedulerController.getScheduledMessages);
router.delete('/:id', schedulerController.cancelMessage);

export default router;
