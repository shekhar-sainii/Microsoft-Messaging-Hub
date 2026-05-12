import { Router } from 'express';
import { messagesController } from './messages.controller';
import { graphMiddleware } from '../../shared/middleware/graph.middleware';

const router = Router();

router.use(graphMiddleware);

router.post('/send', messagesController.sendMessage);
router.post('/retry/:messageId', messagesController.retryMessage);
router.post('/reply', messagesController.reply);
router.delete('/:graphMsgId', messagesController.deleteMessage);
router.get('/sent', messagesController.getSentHistory);
router.get('/history', messagesController.getSentHistory);
router.get('/search', messagesController.searchMessages);
router.get('/:id/replies', messagesController.getReplies);

export default router;
