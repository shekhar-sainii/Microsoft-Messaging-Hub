/**
 * @swagger
 * /schedule:
 *   post:
 *     summary: Schedule a future message broadcast
 *     tags: [Scheduler]
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [teamId, channelId, content, scheduledFor]
 *             properties:
 *               teamId: { type: string, example: "team-123" }
 *               channelId: { type: string, example: "channel-456" }
 *               content: { type: string, example: "Scheduled payload string" }
 *               scheduledFor: { type: string, example: "2026-05-14T10:00:00Z" }
 *               recurrence: { type: string, enum: ['none', 'daily', 'weekly', 'monthly'], example: "none" }
 *               recurrenceEndDate: { type: string, example: "2026-06-14T10:00:00Z" }
 *     responses:
 *       200:
 *         description: Mission scheduled successfully
 *   get:
 *     summary: List pending scheduled message tasks
 *     tags: [Scheduler]
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Extracted scheduled queue payload
 *
 * /schedule/{id}:
 *   delete:
 *     summary: Cancel an active scheduled message sequence
 *     tags: [Scheduler]
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Unique Job ID
 *       - in: query
 *         name: cancelSeries
 *         schema: { type: boolean }
 *         description: Cancel all recurring items in sequence
 *     responses:
 *       200:
 *         description: Job sequence successfully canceled
 *
 * /analytics/summary:
 *   get:
 *     summary: Retrieve aggregate infrastructure metrics
 *     tags: [Analytics]
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Global count overview metrics
 *
 * /analytics/messages:
 *   get:
 *     summary: Retrieve messaging workflow throughput statistics
 *     tags: [Analytics]
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Delivery telemetry arrays
 *
 * /analytics/failures:
 *   get:
 *     summary: Retrieve detailed platform delivery failure logs
 *     tags: [Analytics]
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Array of failed synchronization events
 *
 * /analytics/audit:
 *   get:
 *     summary: Retrieve access audit history log records
 *     tags: [Analytics]
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Immutable action trail list
 *
 * /favourites:
 *   get:
 *     summary: List saved favorite organization streams
 *     tags: [Favourites]
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Array of saved stream metadata blocks
 *   post:
 *     summary: Save an organizational stream to dashboard quicklinks
 *     tags: [Favourites]
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [teamId, channelId]
 *             properties:
 *               teamId: { type: string, example: "team-id-string" }
 *               channelId: { type: string, example: "channel-id-string" }
 *               teamName: { type: string, example: "Global Broadcast Org" }
 *               channelName: { type: string, example: "General Pipeline" }
 *     responses:
 *       200:
 *         description: Stream successfully added to favorites list
 *
 * /favourites/{channelId}:
 *   delete:
 *     summary: Remove an organization stream from favorites list
 *     tags: [Favourites]
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema: { type: string }
 *         description: Destination stream ID
 *     responses:
 *       200:
 *         description: Stream successfully detached from favorites profile
 *
 * /subscriptions:
 *   get:
 *     summary: List verified Microsoft Graph webhook bindings
 *     tags: [Subscriptions]
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Active Graph context interface bindings array
 *
 * /subscriptions/subscribe:
 *   post:
 *     summary: Instantiate new event-based MS Graph Webhook hook
 *     tags: [Subscriptions]
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Successful Graph webhook handshake binding
 *
 * /subscriptions/{id}:
 *   delete:
 *     summary: Detach active MS Graph webhook subscription hook
 *     tags: [Subscriptions]
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Graph subscription identifier
 *     responses:
 *       200:
 *         description: Subscription successfully unlinked from directory
 */
