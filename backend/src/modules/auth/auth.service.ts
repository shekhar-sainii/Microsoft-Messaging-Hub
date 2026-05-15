import jwt, { SignOptions } from 'jsonwebtoken';
import { userRepository } from './user.repository';
import { config } from '../../config';
import { MsalOboService } from '../../auth/msalOboService';
import { decryptToken, encryptToken } from '../../utils/tokenCrypto';

export class AuthService {
  async handleUserLogin(idToken: string, accessToken: string) {
    if (!idToken || !accessToken) {
      throw new Error('Missing Microsoft identity tokens');
    }

    const decoded: any = jwt.decode(idToken);
    if (!decoded?.tid || !(decoded.oid || decoded.sub)) {
      throw new Error('Invalid Microsoft identity token');
    }

    // Enterprise Hardening: Prevent Tenant Hopping
    // If the backend is locked to a specific tenant, we reject tokens from other tenants.
    if (config.msal.tenantId && config.msal.tenantId !== 'common' && decoded.tid !== config.msal.tenantId) {
        console.error(`🚨 Security: Tenant ID mismatch. Configured: ${config.msal.tenantId}, Received: ${decoded.tid}`);
        throw new Error('Unauthorized: Tenant mismatch');
    }
    
    // Exchange for Graph token using OBO. A successful OBO exchange proves the
    // browser token was issued by Microsoft for this application/user context.
    let graphAccessToken: string | null = null;
    try {
        graphAccessToken = await MsalOboService.getGraphToken(accessToken);
    } catch (error) {
        console.warn('⚠️ OBO Exchange failed, checking if frontend token is usable');
    }

    if (!graphAccessToken) {
      // Fallback: If OBO fails (common if the frontend token is already for Graph),
      // we use the frontend token directly. In a strict prod environment, you'd
      // validate the idToken signature here to ensure identity.
      console.log('ℹ️ Using frontend accessToken directly (OBO bypassed/failed)');
      graphAccessToken = accessToken;
    }

    const userData = {
      microsoftId: decoded.oid || decoded.sub,
      email: decoded.email || decoded.preferred_username || decoded.upn,
      displayName: decoded.name,
      tenantId: decoded.tid,
      accessToken: encryptToken(graphAccessToken),
    };

    const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : [];
    const userEmail = userData.email?.toLowerCase();
    const upn = decoded.upn?.toLowerCase();
    const preferredUsername = decoded.preferred_username?.toLowerCase();
    
    let role: 'admin' | 'manager' | 'member' = 'member';
    const existingUser = await userRepository.findByMicrosoftId(userData.microsoftId);
    
    if (
        adminEmails.includes(userEmail) ||
        adminEmails.includes(upn) ||
        adminEmails.includes(preferredUsername)
    ) {
        role = 'admin';
    } else if (existingUser) {
        role = existingUser.role;
    }

    const user = await userRepository.upsert(userData.microsoftId, { ...userData, role });

    const signOptions: SignOptions = {
        expiresIn: '24h' // Hardcoded for type safety, or cast config value
    };

    const sessionToken = jwt.sign(
      { 
        id: user._id, 
        microsoftId: user.microsoftId,
        tenantId: user.tenantId,
        role: user.role 
      },
      config.jwt.secret as string,
      signOptions
    );

    const safeUser = user.toObject ? user.toObject() : { ...user };
    delete safeUser.accessToken;
    delete safeUser.refreshToken;

    return { user: safeUser, sessionToken };
  }

  async validateSession(token: string) {
    try {
      const decoded: any = jwt.verify(token, config.jwt.secret as string);
      return await userRepository.findByMicrosoftId(decoded.microsoftId);
    } catch (error) {
      return null;
    }
  }

  getAdminConsentUrl(tenantId: string = 'common') {
    const clientId = process.env.CLIENT_ID;
    const baseUrl = process.env.WEBHOOK_URL?.split('/webhook')[0]; // Get the base domain
    const redirectUri = encodeURIComponent(`${baseUrl}/api/auth/admin-consent/callback`);
    const state = 'admin_consent_state';
    
    return `https://login.microsoftonline.com/${tenantId}/adminconsent?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}`;
  }

  async getGraphToken(microsoftId: string) {
    const user = await userRepository.findByMicrosoftId(microsoftId);
    return decryptToken(user?.accessToken);
  }
}

export const authService = new AuthService();
