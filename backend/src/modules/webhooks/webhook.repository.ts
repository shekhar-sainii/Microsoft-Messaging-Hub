import { BaseRepository } from '../../shared/BaseRepository';
import GraphSubscriptionModel, { IGraphSubscription } from '../../models/GraphSubscription';

export class WebhookRepository extends BaseRepository<IGraphSubscription> {
    constructor() {
        super(GraphSubscriptionModel);
    }

    async findActive() {
        return this.find({ expirationDateTime: { $gt: new Date() } });
    }

    async findBySubscriptionId(subscriptionId: string) {
        return this.findOne({ subscriptionId });
    }
}

export const webhookRepository = new WebhookRepository();
