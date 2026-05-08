import { BaseRepository } from '../../shared/BaseRepository';
import MessageTemplateModel, { IMessageTemplate } from '../../models/MessageTemplate';

export class TemplateRepository extends BaseRepository<IMessageTemplate> {
    constructor() {
        super(MessageTemplateModel);
    }

    async findByUserId(userId: string) {
        return this.find({ userId });
    }

    async findByName(userId: string, name: string) {
        return this.findOne({ userId, name });
    }
}

export const templateRepository = new TemplateRepository();
