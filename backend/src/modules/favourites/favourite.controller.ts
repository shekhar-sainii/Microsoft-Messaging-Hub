import { Response } from 'express';
import { favouriteService } from './favourite.service';
import { ApiResponse } from '../../shared/ApiResponse';
import { ResponseMessages } from '../../shared/constants';
import { AuthenticatedRequest } from '../../shared/types';

export class FavouriteController {
  async addFavourite(req: AuthenticatedRequest, res: Response) {
    try {
      const { teamId, channelId, teamName, channelName } = req.body;
      const result = await favouriteService.addFavourite(req.user?.microsoftId, { teamId, channelId, teamName, channelName });
      return ApiResponse.success(res, result, ResponseMessages.CREATED);
    } catch (error: any) {
      return ApiResponse.error(res, error);
    }
  }

  async removeFavourite(req: AuthenticatedRequest, res: Response) {
    try {
      const channelId = req.params.channelId as string;
      await favouriteService.removeFavourite(req.user?.microsoftId, channelId);
      return ApiResponse.success(res, null, ResponseMessages.DELETED);
    } catch (error: any) {
      return ApiResponse.error(res, error);
    }
  }

  async getFavourites(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await favouriteService.getFavourites(req.user?.microsoftId);
      return ApiResponse.success(res, result, ResponseMessages.FETCHED);
    } catch (error: any) {
      return ApiResponse.error(res, error);
    }
  }
}

export const favouriteController = new FavouriteController();
