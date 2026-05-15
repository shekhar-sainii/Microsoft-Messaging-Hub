import { webhookService } from './webhook.service';
import { webhookRepository } from './webhook.repository';
import { CryptoUtils } from '../../utils/crypto.utils';
import { ClientCredentialsService } from '../../auth/clientCredentials';

// Mock Repository
jest.mock('./webhook.repository', () => ({
    webhookRepository: {
        create: jest.fn().mockResolvedValue({ id: 'sub-1' }),
        findActive: jest.fn().mockResolvedValue([{ subscriptionId: 'sub-1', resource: '/res' }]),
        findBySubscriptionId: jest.fn().mockResolvedValue({ subscriptionId: 'sub-1', resource: '/res', active: true }),
        delete: jest.fn().mockResolvedValue(true),
        update: jest.fn().mockResolvedValue({}),
    },
}));

jest.mock('../../utils/crypto.utils', () => ({
    CryptoUtils: {
        getPublicKeyBase64: jest.fn().mockReturnValue('mock-cert'),
    },
}));

jest.mock('../../auth/clientCredentials', () => ({
    ClientCredentialsService: {
        getAppToken: jest.fn().mockResolvedValue('app-token'),
    },
}));

jest.mock('../../config/graphClient', () => ({
    createGraphClient: jest.fn(),
}));

jest.mock('../../utils/logger', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

const mockGraphClient = {
    api: jest.fn().mockReturnThis(),
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
};

describe('WebhookService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        const { createGraphClient } = require('../../config/graphClient');
        createGraphClient.mockReturnValue(mockGraphClient);
    });

    describe('createSubscription', () => {
        it('should send correct payload to Graph', async () => {
            mockGraphClient.post.mockResolvedValue({ id: 'graph-sub-1', expirationDateTime: new Date().toISOString() });
            mockGraphClient.api.mockReturnValue(mockGraphClient);

            await webhookService.createSubscription(mockGraphClient as any, 'tenant-1');

            expect(mockGraphClient.api).toHaveBeenCalledWith('/subscriptions');
            expect(mockGraphClient.post).toHaveBeenCalledWith(expect.objectContaining({
                includeResourceData: true,
                encryptionCertificate: 'mock-cert'
            }));
            expect(webhookRepository.create).toHaveBeenCalled();
        });
    });

    describe('lifecycle', () => {
        it('should list active subscriptions', async () => {
            const subs = await webhookService.listSubscriptions();
            expect(subs).toHaveLength(1);
        });

        it('should delete subscription', async () => {
            mockGraphClient.api.mockReturnValue(mockGraphClient);
            await webhookService.deleteSubscription(mockGraphClient as any, 'sub-1');
            expect(mockGraphClient.delete).toHaveBeenCalled();
            expect(webhookRepository.delete).toHaveBeenCalled();
        });

        it('should renew subscription', async () => {
            mockGraphClient.api.mockReturnValue(mockGraphClient);
            await webhookService.renewSubscription(mockGraphClient as any, 'sub-1');
            expect(mockGraphClient.patch).toHaveBeenCalled();
            expect(webhookRepository.update).toHaveBeenCalled();
        });

        it('should renew all active subscriptions', async () => {
            mockGraphClient.api.mockReturnValue(mockGraphClient);
            const renewSpy = jest.spyOn(webhookService, 'renewSubscription').mockResolvedValue({} as any);
            await webhookService.renewSubscriptions(mockGraphClient as any);
            expect(renewSpy).toHaveBeenCalled();
        });
    });

    describe('Delta Catchup', () => {
        it('should fetch delta and update deltalink', async () => {
            mockGraphClient.api.mockReturnValue(mockGraphClient);
            mockGraphClient.get.mockResolvedValue({
                value: [{ id: 'm1' }],
                '@odata.deltaLink': 'new-delta-url'
            });

            await webhookService.catchUpDelta(mockGraphClient as any, 'sub-1');

            expect(mockGraphClient.get).toHaveBeenCalled();
            expect(webhookRepository.update).toHaveBeenCalledWith(
                { subscriptionId: 'sub-1' },
                { deltaLink: 'new-delta-url' }
            );
        });

        it('should handle pagination in delta fetch', async () => {
            mockGraphClient.api.mockReturnValue(mockGraphClient);
            mockGraphClient.get
                .mockResolvedValueOnce({ value: [], '@odata.nextLink': 'next-page' })
                .mockResolvedValueOnce({ value: [], '@odata.deltaLink': 'final-delta' });

            await webhookService.catchUpDelta(mockGraphClient as any, 'sub-1');
            expect(mockGraphClient.get).toHaveBeenCalledTimes(2);
        });
    });
});
