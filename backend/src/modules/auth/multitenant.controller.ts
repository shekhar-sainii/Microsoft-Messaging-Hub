import { Request, Response } from 'express';
import { config } from '../../config';
import { auditRepository } from '../analytics/audit.repository';
import { ApiResponse } from '../../shared/ApiResponse';
import { HttpStatus, ResponseMessages } from '../../shared/constants';

export class MultiTenantController {
  /**
   * Triggers the Azure AD Admin Consent flow.
   */
  async initiateAdminConsent(req: Request, res: Response) {
    const { tenantId } = req.query;
    const clientId = config.msal.clientId;
    const redirectUri = encodeURIComponent(`${process.env.BACKEND_URL}/api/auth/admin-consent/callback`);
    
    // Scopes needed for the whole tenant
    const scopes = encodeURIComponent('https://graph.microsoft.com/.default');
    
    const targetTenant = tenantId || 'common';
    const consentUrl = `https://login.microsoftonline.com/${targetTenant}/adminconsent?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes}`;

    res.redirect(consentUrl);
  }

  /**
   * Callback received after admin grants consent.
   */
  async adminConsentCallback(req: Request, res: Response) {
    const { tenant, error, error_description } = req.query;

    if (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({ error, description: error_description });
    }

    await auditRepository.log({
      eventType: 'admin_consent_granted',
      details: `Admin consent granted for tenant ${tenant}`,
      status: 'success',
      userId: 'SYSTEM',
      metadata: { tenantId: tenant }
    });

    // Redirect back to frontend success page
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/admin/consent-success?tenant=${tenant}`);
  }

  async listTenants(req: Request, res: Response) {
    try {
        // In a real app, this would query a 'Tenants' collection. 
        // For now, we aggregate unique tenantIds from Audit Logs.
        const tenants = await auditRepository.find({ eventType: 'admin_consent_granted' });
        const uniqueTenants = Array.from(new Set(tenants.map(t => t.metadata?.tenantId)));
        
        return ApiResponse.success(res, uniqueTenants, ResponseMessages.TENANT_LISTED);
    } catch (error: any) {
        return ApiResponse.error(res, error);
    }
  }
}

export const multiTenantController = new MultiTenantController();
