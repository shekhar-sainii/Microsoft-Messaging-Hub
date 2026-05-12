import { Router } from 'express';
import { authController } from './auth.controller';
import { authMiddleware } from '../../auth/authMiddleware';

const router = Router();

router.post('/login', authController.login);
router.post('/msal-token', authController.login);
router.post('/logout', authController.logout);
router.get('/me', authMiddleware, authController.getMe);
router.get('/admin-consent', authController.adminConsent);
router.get('/admin-consent/callback', authController.handleAdminConsentCallback);
router.get('/graph-token', authMiddleware, authController.getGraphToken);

export default router;
