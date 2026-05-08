import { Response } from 'express';
import { templateService } from './template.service';
import { ApiResponse } from '../../shared/ApiResponse';
import { ResponseMessages } from '../../shared/constants';
import { AuthenticatedRequest } from '../../shared/types';

export class TemplateController {
  async saveTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, content, description, type } = req.body;
      const result = await templateService.saveTemplate(req.user?.microsoftId, name, content, description, type);
      return ApiResponse.success(res, result, ResponseMessages.CREATED);
    } catch (error: any) {
      return ApiResponse.error(res, error);
    }
  }

  async listTemplates(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await templateService.listTemplates(req.user?.microsoftId);
      return ApiResponse.success(res, result, ResponseMessages.FETCHED);
    } catch (error: any) {
      return ApiResponse.error(res, error);
    }
  }

  async updateTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const result = await templateService.updateTemplate(req.user?.microsoftId, id, req.body);
      return ApiResponse.success(res, result, ResponseMessages.UPDATED);
    } catch (error: any) {
      return ApiResponse.error(res, error);
    }
  }

  async deleteTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      const id = req.params.id as string;
      await templateService.deleteTemplate(req.user?.microsoftId, id);
      return ApiResponse.success(res, null, ResponseMessages.DELETED);
    } catch (error: any) {
      return ApiResponse.error(res, error);
    }
  }
}

export const templateController = new TemplateController();
