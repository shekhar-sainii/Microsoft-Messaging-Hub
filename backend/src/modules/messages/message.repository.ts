import { BaseRepository } from '../../shared/BaseRepository';
import SentMessageModel, { ISentMessage } from '../../models/SentMessage';

export class MessageRepository extends BaseRepository<ISentMessage> {
    constructor() {
        super(SentMessageModel);
    }

    async findByUserId(userId: string) {
        return this.find({ userId });
    }

    async getStats(userId: string) {
        const all = await this.find({ userId });
        const sent = all.filter(m => m.status === 'sent').length;
        const failed = all.filter(m => m.status === 'failed').length;
        return { sent, failed, total: all.length };
    }
}

export const messageRepository = new MessageRepository();
