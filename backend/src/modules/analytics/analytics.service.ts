import { AuditLogModel } from '../../models/AuditLog';

export class AnalyticsService {
  async getMessageStats(userId: string) {
    const stats = await AuditLogModel.aggregate([
      { $match: { userId, eventType: { $in: ['message_sent', 'message_failed'] } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            type: "$eventType"
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.date": 1 } }
    ]);

    const formatted: Record<string, any> = {};
    stats.forEach(s => {
      const date = s._id.date;
      if (!formatted[date]) formatted[date] = { date, sent: 0, failed: 0 };
      if (s._id.type === 'message_sent') formatted[date].sent = s.count;
      if (s._id.type === 'message_failed') formatted[date].failed = s.count;
    });

    return Object.values(formatted);
  }

  async getAuditLogs(userId: string, limit = 10, offset = 0) {
    return AuditLogModel.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset);
  }

  async getFailureLogs(userId: string, limit = 10) {
    return AuditLogModel.find({ userId, status: 'failure' })
      .sort({ createdAt: -1 })
      .limit(limit);
  }
}

export const analyticsService = new AnalyticsService();
