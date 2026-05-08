import { BaseRepository } from '../../shared/BaseRepository';
import ScheduledMessageModel, { IScheduledMessage } from '../../models/ScheduledMessage';

export class SchedulerRepository extends BaseRepository<IScheduledMessage> {
    constructor() {
        super(ScheduledMessageModel);
    }

    async findByUser(userId: string) {
        return this.find({ userId });
    }

    async findPending() {
        return this.find({ status: 'pending', scheduledFor: { $lte: new Date() } });
    }

    async updateStatus(id: string, status: string, error?: string) {
        return this.update({ _id: id }, { status, error });
    }
}

export const schedulerRepository = new SchedulerRepository();
