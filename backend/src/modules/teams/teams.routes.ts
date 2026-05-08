import { Router } from 'express';
import { teamsController } from './teams.controller';
import { graphMiddleware } from '../../shared/middleware/graph.middleware';

const router = Router();

router.use(graphMiddleware);

router.get('/initial', teamsController.getInitialData);
router.get('/', teamsController.getTeams);
router.get('/:teamId', teamsController.getTeamDetail);
router.get('/:teamId/channels', teamsController.getChannels);
router.get('/:teamId/channels/:chId', teamsController.getChannelDetail);
router.get('/:teamId/members', teamsController.getTeamMembers);

export default router;
