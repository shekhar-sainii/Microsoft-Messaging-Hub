import { BaseRepository } from '../../shared/BaseRepository';
import { AuditLogModel, IAuditLog } from '../../models/AuditLog';

export class AuditRepository extends BaseRepository<IAuditLog> {
    constructor() {
        super(AuditLogModel);
    }

    async log(data: Partial<IAuditLog>) {
        return this.create(data as any);
    }

    async findByUserId(userId: string, limit = 50, skip = 0) {
        return this.model.find({ userId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip(skip)
            .exec();
    }
}

export const auditRepository = new AuditRepository();
