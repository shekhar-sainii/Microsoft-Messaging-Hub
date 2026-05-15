import { analyticsService } from './analytics.service';
import { messageRepository } from '../messages/message.repository';
import { auditRepository } from './audit.repository';
import { webhookRepository } from '../webhooks/webhook.repository';

jest.mock('../messages/message.repository', () => ({
  messageRepository: {
    getStats: jest.fn(),
    find: jest.fn(),
  },
}));

jest.mock('./audit.repository', () => ({
  auditRepository: {
    findByUserId: jest.fn(),
  },
}));

jest.mock('../webhooks/webhook.repository', () => ({
  webhookRepository: {
    findActive: jest.fn(),
  },
}));

describe('AnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (messageRepository.getStats as jest.Mock).mockResolvedValue({ sent: 10, failed: 2, total: 12 });
    (webhookRepository.findActive as jest.Mock).mockResolvedValue([{ id: 'sub-1' }, { id: 'sub-2' }]);
  });

  it('combines message and subscription summary stats', async () => {
    const summary = await analyticsService.getSummaryStats('u1');

    expect(summary).toEqual(expect.objectContaining({
      activeSubs: 2,
      totalSent: 10,
      totalFailed: 2,
      totalMessages: 12,
      lastUpdated: expect.any(Date),
    }));
  });

  it('returns seven message trend rows', async () => {
    const trend = await analyticsService.getMessageStats('u1');

    expect(trend).toHaveLength(7);
    expect(trend[0]).toEqual(expect.objectContaining({
      name: expect.any(String),
      success: expect.any(Number),
      failure: expect.any(Number),
    }));
  });

  it('returns failed message logs for the user', async () => {
    (messageRepository.find as jest.Mock).mockResolvedValue([{ id: 'm1' }]);

    await expect(analyticsService.getFailureLogs('u1')).resolves.toEqual([{ id: 'm1' }]);
    expect(messageRepository.find).toHaveBeenCalledWith({ userId: 'u1', status: 'failed' });
  });

  it('normalizes non-array audit responses to an empty list', async () => {
    (auditRepository.findByUserId as jest.Mock).mockResolvedValue(null);

    await expect(analyticsService.getAuditLogs('u1')).resolves.toEqual([]);
  });
});
