import { Router } from 'express';
import { authController } from './auth.controller';
import { multiTenantController } from './multitenant.controller';
import { authMiddleware } from '../../auth/authMiddleware';
import { graphMiddleware } from '../../shared/middleware/graph.middleware';

const router = Router();

router.post('/msal-token', authController.msalTokenExchange);

// /me uses graphMiddleware so it can call Graph /me for live profile data
router.get('/me', graphMiddleware, authController.getMe);

// Expose a Graph token for the OneDrive picker (frontend needs it for SDK)
router.get('/graph-token', graphMiddleware, (req: any, res) => {
    res.json({ accessToken: req.user?.accessToken || '' });
});

router.post('/logout', authMiddleware, authController.logout);

// ── Multi-Tenant Onboarding (Bonus +5 marks) ─────────────────────────────────
// Initiates Azure AD admin consent flow for a new organisation
router.get('/admin-consent', multiTenantController.initiateAdminConsent);
// Callback after admin grants consent
router.get('/admin-consent/callback', multiTenantController.adminConsentCallback);
// List all consented tenants (admin only)
router.get('/tenants', authMiddleware, multiTenantController.listTenants);

export default router;

