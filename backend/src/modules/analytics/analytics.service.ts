import { messageRepository } from '../messages/message.repository';
import { auditRepository } from './audit.repository';
import { webhookRepository } from '../webhooks/webhook.repository';

export class AnalyticsService {
  async getSummaryStats(userId: string) {
    const messageStats = await messageRepository.getStats(userId);
    const activeSubs = await webhookRepository.findActive();
    
    return {
      activeSubs: activeSubs.length,
      totalSent: messageStats.sent,
      totalFailed: messageStats.failed,
      totalMessages: messageStats.total,
      lastUpdated: new Date()
    };
  }

  async getMessageStats(userId: string) {
    const stats = await messageRepository.getStats(userId);
    // Return a 7-day trend (mocked for now, but incorporates real current stats)
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const currentDayIndex = new Date().getDay(); // 0 is Sun
    
    return days.map((name, i) => ({
      name,
      success: i === currentDayIndex ? stats.sent : Math.floor(Math.random() * 50) + 10,
      failure: i === currentDayIndex ? stats.failed : Math.floor(Math.random() * 5)
    }));
  }

  async getFailureLogs(userId: string) {
    return messageRepository.find({ userId, status: 'failed' });
  }

  async getAuditLogs(userId: string, limit = 50, skip = 0) {
    const logs = await auditRepository.findByUserId(userId, limit, skip);
    return Array.isArray(logs) ? logs : [];
  }
  
  /**
   * Fetches current throttle status for the user's tenant.
   * This provides data for the 'Rate Limit Dashboard' requirement.
   */
  async getRateLimitStatus(tenantId: string) {
    const { redis } = await import('../../config/redis');
    const key = `ratelimit:${tenantId}`;
    const tokens = await redis.get(key);
    
    return {
        tenantId,
        remainingTokens: tokens ? parseInt(tokens, 10) : 3,
        limit: 3,
        status: tokens && parseInt(tokens, 10) <= 0 ? 'Throttled' : 'Healthy',
        lastUpdated: new Date()
    };
  }
}

export const analyticsService = new AnalyticsService();
