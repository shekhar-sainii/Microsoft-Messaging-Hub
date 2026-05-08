import { Response } from 'express';
import { teamsService } from './teams.service';
import { AuthenticatedRequest } from '../../shared/types';
import { ApiResponse } from '../../shared/ApiResponse';
import { ResponseMessages } from '../../shared/constants';

export class TeamsController {
  async getTeams(req: AuthenticatedRequest, res: Response) {
    try {
      const teams = await teamsService.getJoinedTeams(req.graphClient!, req.user?.microsoftId);
      return ApiResponse.success(res, teams, ResponseMessages.FETCHED);
    } catch (error: any) {
      return ApiResponse.error(res, error);
    }
  }

  async getInitialData(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await teamsService.getInitialData(req.graphClient!, req.user?.microsoftId);
      return ApiResponse.success(res, data, ResponseMessages.FETCHED);
    } catch (error: any) {
      return ApiResponse.error(res, error);
    }
  }

  async getTeamDetail(req: AuthenticatedRequest, res: Response) {
    try {
      const teamId = req.params.teamId as string;
      const team = await teamsService.getTeamDetail(req.graphClient!, teamId);
      return ApiResponse.success(res, team, ResponseMessages.FETCHED);
    } catch (error: any) {
      return ApiResponse.error(res, error);
    }
  }

  async getChannels(req: AuthenticatedRequest, res: Response) {
    try {
      const teamId = req.params.teamId as string;
      const channels = await teamsService.getTeamChannels(req.graphClient!, teamId, req.user?.microsoftId);
      await teamsService.trackRecentTeam(req.user?.microsoftId, teamId);
      return ApiResponse.success(res, channels, ResponseMessages.FETCHED);
    } catch (error: any) {
      return ApiResponse.error(res, error);
    }
  }

  async getChannelDetail(req: AuthenticatedRequest, res: Response) {
    try {
      const teamId = req.params.teamId as string;
      const chId = req.params.chId as string;
      const channel = await teamsService.getChannelDetail(req.graphClient!, teamId, chId);
      return ApiResponse.success(res, channel, ResponseMessages.FETCHED);
    } catch (error: any) {
      return ApiResponse.error(res, error);
    }
  }

  async getTeamMembers(req: AuthenticatedRequest, res: Response) {
    try {
      const teamId = req.params.teamId as string;
      const members = await teamsService.getTeamMembers(req.graphClient!, teamId, req.user?.microsoftId);
      return ApiResponse.success(res, members, ResponseMessages.FETCHED);
    } catch (error: any) {
      return ApiResponse.error(res, error);
    }
  }
}

export const teamsController = new TeamsController();
