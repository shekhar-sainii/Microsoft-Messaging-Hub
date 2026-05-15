import { authService } from './auth.service';
import { userRepository } from './user.repository';
import { MsalOboService } from '../../auth/msalOboService';
import jwt from 'jsonwebtoken';

jest.mock('./user.repository', () => ({
    userRepository: {
        findByMicrosoftId: jest.fn(),
        upsert: jest.fn().mockImplementation((id, data) => Promise.resolve({ _id: 'user-1', ...data })),
    },
}));

jest.mock('../../auth/msalOboService', () => ({
    MsalOboService: {
        getGraphToken: jest.fn().mockResolvedValue('graph-token'),
    },
}));

jest.mock('../../config', () => ({
    config: {
        jwt: { secret: 'test-secret' },
    },
}));

describe('AuthService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.ADMIN_EMAILS = '';
    });

    describe('handleUserLogin', () => {
        it('should create a session for a new user', async () => {
            const idToken = jwt.sign({ oid: 'oid-1', tid: 'tenant-1', email: 'test@example.com', name: 'User' }, 'secret');
            
            const result = await authService.handleUserLogin(idToken, 'access-token');

            expect(result.user.microsoftId).toBe('oid-1');
            expect(result.sessionToken).toBeDefined();
            expect(userRepository.upsert).toHaveBeenCalled();
        });

        it('should assign admin role for configured admin email', async () => {
            process.env.ADMIN_EMAILS = 'admin@example.com';
            const idToken = jwt.sign({ oid: 'oid-1', tid: 'tenant-1', upn: 'admin@example.com', name: 'Admin' }, 'secret');
            
            const result = await authService.handleUserLogin(idToken, 'access-token');
            expect(result.user.role).toBe('admin');
        });
    });

    describe('validateSession', () => {
        it('should return user for valid token', async () => {
            const token = jwt.sign({ microsoftId: 'oid-1' }, 'test-secret');
            (userRepository.findByMicrosoftId as jest.Mock).mockResolvedValue({ _id: 'u1' });

            const user = await authService.validateSession(token);
            expect(user).toBeDefined();
        });

        it('should return null for invalid token', async () => {
            const user = await authService.validateSession('invalid-token');
            expect(user).toBeNull();
        });
    });

    describe('getAdminConsentUrl', () => {
        it('should build correct URL', () => {
            process.env.CLIENT_ID = 'client-id';
            process.env.WEBHOOK_URL = 'http://localhost/webhook';
            
            const url = authService.getAdminConsentUrl('tenant-1');
            expect(url).toContain('tenant-1');
            expect(url).toContain('client-id');
        });
    });
});
