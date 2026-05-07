import { Response } from 'express';
import { templateService } from './template.service';
import { AuthenticatedRequest } from '../../auth/authMiddleware';

export class TemplateController {
  async save(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, content, description } = req.body;
      const result = await templateService.saveTemplate(req.user.microsoftId, name, content, description);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const templates = await templateService.listTemplates(req.user.microsoftId);
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
        const id = req.params.id as string;
        const result = await templateService.updateTemplate(req.user.microsoftId, id, req.body);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const result = await templateService.deleteTemplate(req.user.microsoftId, id);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const templateController = new TemplateController();
