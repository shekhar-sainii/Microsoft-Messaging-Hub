/**
 * @swagger
 * /messages/send:
 *   post:
 *     summary: Send a message or Adaptive Card
 *     tags: [Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [teamId, channelId]
 *             properties:
 *               teamId: { type: string }
 *               channelId: { type: string }
 *               content: { type: string }
 *               isAdaptiveCard: { type: boolean }
 *               cardJson: { type: object }
 *     responses:
 *       200:
 *         description: Message sent
 *
 * /messages/history:
 *   get:
 *     summary: Get user's message history
 *     tags: [Messages]
 *     responses:
 *       200:
 *         description: Array of sent messages
 *
 * /messages/retry/{messageId}:
 *   post:
 *     summary: Retry a failed message
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *     responses:
 *       200:
 *         description: Retry successful
 */
