import { Router } from 'express';
import { messagesController } from './messages.controller';
import { graphMiddleware } from '../../shared/middleware/graph.middleware';

const router = Router();

router.use(graphMiddleware);

/**
 * @swagger
 * /messages/send:
 *   post:
 *     summary: Send a message or Adaptive Card to a Teams channel
 *     description: |
 *       Posts a rich HTML message or Adaptive Card to the specified channel via Graph API.
 *       The message is saved in the local SentMessage collection.
 *       - For plain messages: set `isAdaptiveCard: false` and provide `content` (HTML).
 *       - For Adaptive Cards: set `isAdaptiveCard: true` and provide `cardJson` (schema ≤ 1.4).
 *
 *       **Important**: Card JSON is automatically serialised to a string before sending — do NOT pre-stringify it.
 *     tags: [Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendMessageRequest'
 *     responses:
 *       200:
 *         description: Message sent successfully — returns Graph API response
 *       500:
 *         description: Graph API error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/send', messagesController.sendMessage);

/**
 * @swagger
 * /messages/retry/{messageId}:
 *   post:
 *     summary: Retry a failed message
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message retried successfully
 */
router.post('/retry/:messageId', messagesController.retryMessage);

/**
 * @swagger
 * /messages/reply:
 *   post:
 *     summary: Reply to an existing message thread
 *     tags: [Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [teamId, channelId, messageId, content]
 *             properties:
 *               teamId:
 *                 type: string
 *               channelId:
 *                 type: string
 *               messageId:
 *                 type: string
 *                 description: Graph message ID of the parent message
 *               content:
 *                 type: string
 *                 description: HTML reply body
 *     responses:
 *       200:
 *         description: Reply posted successfully
 */
router.post('/reply', messagesController.reply);

/**
 * @swagger
 * /messages/sent:
 *   get:
 *     summary: Paginated sent message history
 *     tags: [Messages]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Array of sent messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SentMessage'
 */
router.get('/sent', messagesController.getSentHistory);

/**
 * @swagger
 * /messages/search:
 *   get:
 *     summary: Full-text search across sent message history
 *     tags: [Messages]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query (case-insensitive regex match on message content)
 *     responses:
 *       200:
 *         description: Matching messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SentMessage'
 */
router.get('/search', messagesController.searchMessages);

/**
 * @swagger
 * /messages/{id}/replies:
 *   get:
 *     summary: Fetch the reply chain for a message
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Graph message ID
 *       - in: query
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Array of reply messages from Graph
 */
router.get('/:id/replies', messagesController.getReplies);

/**
 * @swagger
 * /messages/{graphMsgId}:
 *   delete:
 *     summary: Delete a sent message via Graph API
 *     description: Soft-deletes the message via Graph DELETE endpoint and removes it from the local DB. Only works within Teams' deletion window.
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: graphMsgId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.delete('/:graphMsgId', messagesController.deleteMessage);

export default router;

