import jwt, { SignOptions } from 'jsonwebtoken';
import { userRepository } from './user.repository';
import { config } from '../../config';
import { MsalOboService } from '../../auth/msalOboService';

export class AuthService {
  async handleUserLogin(idToken: string, accessToken: string) {
    const decoded: any = jwt.decode(idToken);
    
    // Exchange for Graph token using OBO
    const graphAccessToken = await MsalOboService.getGraphToken(accessToken);

    const userData = {
      microsoftId: decoded.oid || decoded.sub,
      email: decoded.email || decoded.preferred_username || decoded.upn,
      displayName: decoded.name,
      tenantId: decoded.tid,
      accessToken: graphAccessToken || accessToken,
    };

    const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : [];
    const userEmail = userData.email?.toLowerCase();
    const upn = decoded.upn?.toLowerCase();
    const preferredUsername = decoded.preferred_username?.toLowerCase();
    
    // Explicitly add user's admin email to the list for safety
    const targetAdminEmail = "admin@shekharsaini2030gmail.onmicrosoft.com";
    
    let role: 'admin' | 'manager' | 'member' = 'member';
    const existingUser = await userRepository.findByMicrosoftId(userData.microsoftId);
    
    if (
        userEmail === targetAdminEmail || 
        upn === targetAdminEmail || 
        preferredUsername === targetAdminEmail ||
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
        tenantId: user.tenantId 
      },
      config.jwt.secret as string,
      signOptions
    );

    return { user, sessionToken };
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
}

export const authService = new AuthService();
