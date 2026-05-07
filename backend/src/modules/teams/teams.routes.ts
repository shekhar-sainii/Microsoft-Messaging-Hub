import { Router } from 'express';
import { teamsController } from './teams.controller';
import { graphMiddleware } from '../../shared/middleware/graph.middleware';

const router = Router();

router.use(graphMiddleware);

/**
 * @swagger
 * /teams:
 *   get:
 *     summary: List all joined Teams
 *     description: Returns Teams the signed-in user belongs to via Graph /me/joinedTeams. Cached in Redis for 5 minutes.
 *     tags: [Teams]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Filter teams by display name (client-side)
 *     responses:
 *       200:
 *         description: List of Teams
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Team'
 */
/**
 * @swagger
 * /teams/initial:
 *   get:
 *     summary: Fetch initial dashboard data in one request
 *     description: Uses Graph $batch to fetch joined teams and current user profile simultaneously.
 *     tags: [Teams]
 *     responses:
 *       200:
 *         description: Initial data package
 */
router.get('/initial', teamsController.getInitialData);

router.get('/', teamsController.getTeams);

/**
 * @swagger
 * /teams/{teamId}:
 *   get:
 *     summary: Get Team details
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Team detail object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Team'
 */
router.get('/:teamId', teamsController.getTeamDetail);

/**
 * @swagger
 * /teams/{teamId}/channels:
 *   get:
 *     summary: List channels in a Team
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of channels
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Channel'
 */
router.get('/:teamId/channels', teamsController.getChannels);

/**
 * @swagger
 * /teams/{teamId}/channels/{chId}:
 *   get:
 *     summary: Get Channel detail
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: chId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Channel detail
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Channel'
 */
router.get('/:teamId/channels/:chId', teamsController.getChannelDetail);

/**
 * @swagger
 * /teams/{teamId}/members:
 *   get:
 *     summary: List Team members
 *     description: Fetches members for @mention autocomplete in the message composer.
 *     tags: [Teams]
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Array of member objects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   displayName:
 *                     type: string
 *                   email:
 *                     type: string
 */
router.get('/:teamId/members', teamsController.getTeamMembers);

export default router;

