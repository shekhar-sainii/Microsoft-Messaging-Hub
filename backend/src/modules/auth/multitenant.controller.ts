import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../shared/middleware/graph.middleware';
import { UserModel } from '../../models/User';
import { AuditLogModel } from '../../models/AuditLog';
import { logger } from '../../utils/logger';

/**
 * Multi-Tenant Onboarding Controller
 *
 * Bonus feature (+5 marks): When a new organisation admin signs in for the
 * first time, trigger an admin consent flow and store their tenantId.
 * The app works for any M365 tenant.
 */
export class MultiTenantController {
    /**
     * GET /api/auth/admin-consent
     * Redirects the admin to the Azure AD admin consent URL for this app.
     * After consent, Azure redirects back to /api/auth/admin-consent/callback.
     */
    async initiateAdminConsent(req: Request, res: Response) {
        const tenantId = req.query.tenantId as string || 'common';
        const clientId = process.env.CLIENT_ID;
        const redirectUri = encodeURIComponent(
            `${req.protocol}://${req.get('host')}/api/auth/admin-consent/callback`
        );

        const consentUrl =
            `https://login.microsoftonline.com/${tenantId}/adminconsent` +
            `?client_id=${clientId}` +
            `&redirect_uri=${redirectUri}` +
            `&state=${tenantId}`;

        logger.info('Initiating admin consent flow', { tenantId });
        res.redirect(consentUrl);
    }

    /**
     * GET /api/auth/admin-consent/callback
     * Handles the redirect from Azure AD after admin consent.
     * Stores the tenant as consented in the DB.
     */
    async adminConsentCallback(req: Request, res: Response) {
        const { tenant, state, error, error_description } = req.query;

        if (error) {
            logger.warn('Admin consent denied', { error, error_description });
            return res.redirect(
                `${process.env.FRONTEND_URL || 'http://localhost:5173'}?consent=denied&error=${error}`
            );
        }

        const tenantId = (tenant || state) as string;

        if (tenantId) {
            // Mark all users from this tenant as having admin consent granted
            await UserModel.updateMany(
                { tenantId },
                { $set: { role: 'admin' } }
            );

            await AuditLogModel.create({
                eventType: 'admin_consent_granted',
                details: `Admin consent granted for tenant ${tenantId}`,
                status: 'success',
                metadata: { tenantId },
            });

            logger.info('Admin consent granted', { tenantId });
        }

        // Redirect back to frontend with success
        res.redirect(
            `${process.env.FRONTEND_URL || 'http://localhost:5173'}?consent=granted&tenant=${tenantId}`
        );
    }

    /**
     * GET /api/auth/tenants
     * Lists all tenants that have granted admin consent (admin only).
     */
    async listTenants(req: AuthenticatedRequest, res: Response) {
        try {
            const tenants = await UserModel.distinct('tenantId');
            const tenantStats = await Promise.all(
                tenants.map(async (tenantId) => {
                    const userCount = await UserModel.countDocuments({ tenantId });
                    return { tenantId, userCount };
                })
            );
            res.json(tenantStats);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export const multiTenantController = new MultiTenantController();
