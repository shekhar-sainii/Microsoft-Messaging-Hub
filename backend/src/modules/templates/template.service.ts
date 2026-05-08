import { templateRepository } from './template.repository';

export class TemplateService {
  async saveTemplate(userId: string, name: string, content: any, description?: string, type: string = 'adaptive') {
    return templateRepository.create({
      userId,
      name,
      content,
      description,
      type
    } as any);
  }

  async listTemplates(userId: string) {
    return templateRepository.findByUserId(userId);
  }

  async updateTemplate(userId: string, id: string, data: any) {
    return templateRepository.update({ _id: id, userId }, data);
  }

  async deleteTemplate(userId: string, id: string) {
    return templateRepository.delete({ _id: id, userId });
  }
}

export const templateService = new TemplateService();
