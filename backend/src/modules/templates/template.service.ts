import MessageTemplateModel from '../../models/MessageTemplate';

export class TemplateService {
  async saveTemplate(userId: string, name: string, content: any, description?: string) {
    const template = new MessageTemplateModel({
      userId,
      name,
      content,
      description
    });
    return template.save();
  }

  async listTemplates(userId: string) {
    return MessageTemplateModel.find({ userId }).sort({ updatedAt: -1 });
  }

  async getTemplate(userId: string, templateId: string) {
    return MessageTemplateModel.findOne({ _id: templateId, userId });
  }

  async deleteTemplate(userId: string, templateId: string) {
    return MessageTemplateModel.findOneAndDelete({ _id: templateId, userId });
  }

  async updateTemplate(userId: string, templateId: string, data: { name?: string; content?: any; description?: string }) {
    return MessageTemplateModel.findOneAndUpdate(
      { _id: templateId, userId },
      data,
      { new: true }
    );
  }
}

export const templateService = new TemplateService();
