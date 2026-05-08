import { authService } from './auth.service';
import { userRepository } from './user.repository';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('./user.repository');
jest.mock('../../auth/msalOboService', () => ({
    MsalOboService: {
        getGraphToken: jest.fn().mockResolvedValue('mock-graph-token'),
    },
}));

describe('AuthService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret-at-least-32-chars-long!!';
    });

    describe('handleUserLogin', () => {
        it('should decode idToken and upsert user', async () => {
            const idToken = jwt.sign(
                {
                    sub: 'test-sub-123',
                    oid: '00000000-0000-0000-test-oid',
                    name: 'Test User',
                    preferred_username: 'test@example.com',
                    tid: 'test-tenant-id',
                },
                'any-secret'
            );

            const mockUser = {
                _id: 'user-db-id',
                microsoftId: '00000000-0000-0000-test-oid',
                email: 'test@example.com',
                displayName: 'Test User',
                tenantId: 'test-tenant-id',
            };

            (userRepository.upsert as jest.Mock).mockResolvedValue(mockUser);

            const result = await authService.handleUserLogin(idToken, 'access-token');

            expect(userRepository.upsert).toHaveBeenCalledWith(
                '00000000-0000-0000-test-oid',
                expect.objectContaining({
                    displayName: 'Test User',
                    email: 'test@example.com',
                    tenantId: 'test-tenant-id',
                })
            );
            expect(result.sessionToken).toBeDefined();
            expect(result.user).toEqual(mockUser);
        });
    });
});
