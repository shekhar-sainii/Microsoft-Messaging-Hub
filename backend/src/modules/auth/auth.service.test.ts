import { AuthService } from './auth.service';
import { UserRepository } from './user.repository';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('./user.repository');
jest.mock('../../auth/msalOboService', () => ({
    MsalOboService: {
        getGraphToken: jest.fn().mockResolvedValue('mock-graph-token'),
    },
}));

const mockUserRepo = {
    upsert: jest.fn(),
    findByMicrosoftId: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
};

describe('AuthService', () => {
    let authService: AuthService;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret-at-least-32-chars-long!!';
        authService = new AuthService(mockUserRepo as any);
    });

    describe('handleUserLogin', () => {
        it('should decode idToken and upsert user', async () => {
            // Create a valid JWT-like idToken (decoded only, not verified)
            const idToken = jwt.sign(
                {
                    sub: 'test-sub-123',
                    oid: '00000000-0000-0000-test-oid',
                    name: 'Test User',
                    preferred_username: 'test@example.com',
                    tid: 'test-tenant-id',
                },
                'any-secret' // We only decode, not verify
            );

            const mockUser = {
                _id: 'user-db-id',
                microsoftId: 'test-sub-123',
                email: 'test@example.com',
                displayName: 'Test User',
                tenantId: 'test-tenant-id',
            };

            mockUserRepo.upsert.mockResolvedValue(mockUser);

            const result = await authService.handleUserLogin(idToken, 'access-token');

            expect(mockUserRepo.upsert).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    displayName: 'Test User',
                    email: 'test@example.com',
                    tenantId: 'test-tenant-id',
                })
            );
            expect(result.sessionToken).toBeDefined();
            expect(result.user).toEqual(mockUser);
        });

        it('should throw if idToken is invalid', async () => {
            await expect(
                authService.handleUserLogin('not-a-jwt', 'access-token')
            ).rejects.toThrow();
        });

        it('should use sub as microsoftId for personal accounts (oid starts with 00000000-0000-0000-)', async () => {
            const idToken = jwt.sign(
                {
                    sub: 'personal-sub-abc',
                    oid: '00000000-0000-0000-3a69-01faa3b0bb7b',
                    name: 'Personal User',
                    preferred_username: 'personal@gmail.com',
                    tid: '9188040d-6c67-4c5b-b112-36a304b66dad',
                },
                'any-secret'
            );

            mockUserRepo.upsert.mockResolvedValue({ _id: 'id', microsoftId: 'personal-sub-abc', email: 'personal@gmail.com', displayName: 'Personal User', tenantId: '9188040d' });

            await authService.handleUserLogin(idToken, 'access-token');

            expect(mockUserRepo.upsert).toHaveBeenCalledWith(
                'personal-sub-abc', // sub, not oid
                expect.any(Object)
            );
        });
    });

    describe('getGraphToken', () => {
        it('should call MsalOboService.getGraphToken', async () => {
            const { MsalOboService } = require('../../auth/msalOboService');
            const result = await authService.getGraphToken('user-access-token');
            expect(MsalOboService.getGraphToken).toHaveBeenCalledWith('user-access-token');
            expect(result).toBe('mock-graph-token');
        });
    });
});
