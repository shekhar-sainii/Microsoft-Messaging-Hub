/**
 * @swagger
 * components:
 *   schemas:
 *     Team:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         displayName: { type: string }
 *         description: { type: string }
 *     Channel:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         displayName: { type: string }
 *         description: { type: string }
 */

/**
 * @swagger
 * /teams:
 *   get:
 *     summary: List all joined Teams
 *     tags: [Teams]
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of Teams
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Team' }
 *
 * /teams/initial:
 *   get:
 *     summary: Fetch initial dashboard data
 *     tags: [Teams]
 *     responses:
 *       200:
 *         description: Initial data package
 *
 * /teams/{teamId}:
 *   get:
 *     summary: Get Team details
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Team detail
 *
 * /teams/{teamId}/channels:
 *   get:
 *     summary: List channels in a Team
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of channels
 *
 * /teams/{teamId}/channels/{chId}:
 *   get:
 *     summary: Get Channel detail
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *       - in: path
 *         name: chId
 *         required: true
 *     responses:
 *       200:
 *         description: Channel detail
 *
 * /teams/{teamId}/members:
 *   get:
 *     summary: List Team members
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *     responses:
 *       200:
 *         description: Array of member objects
 */
