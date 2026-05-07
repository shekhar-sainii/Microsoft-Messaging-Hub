import { Response } from 'express';
import { teamsService } from './teams.service';
import { AuthenticatedRequest } from '../../shared/middleware/graph.middleware';

export class TeamsController {
  async getTeams(req: AuthenticatedRequest, res: Response) {
    try {
      const teams = await teamsService.getJoinedTeams(req.graphClient!, req.user.microsoftId);
      res.json(teams);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getInitialData(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await teamsService.getInitialData(req.graphClient!, req.user.microsoftId);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getTeamDetail(req: AuthenticatedRequest, res: Response) {
    try {
      const teamId = req.params.teamId as string;
      const team = await teamsService.getTeamDetail(req.graphClient!, teamId);
      res.json(team);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getChannels(req: AuthenticatedRequest, res: Response) {
    try {
      const teamId = req.params.teamId as string;
      const channels = await teamsService.getTeamChannels(req.graphClient!, teamId, req.user.microsoftId);

      // Track recent channels in Redis (last 5, 7-day expiry)
      // Called when user expands a team to see channels
      await teamsService.trackRecentTeam(req.user.microsoftId, teamId);

      res.json(channels);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getChannelDetail(req: AuthenticatedRequest, res: Response) {
    try {
      const teamId = req.params.teamId as string;
      const chId = req.params.chId as string;
      const channel = await teamsService.getChannelDetail(req.graphClient!, teamId, chId);
      res.json(channel);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getTeamMembers(req: AuthenticatedRequest, res: Response) {
    try {
      const teamId = req.params.teamId as string;
      const members = await teamsService.getTeamMembers(req.graphClient!, teamId, req.user.microsoftId);
      res.json(members);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const teamsController = new TeamsController();
