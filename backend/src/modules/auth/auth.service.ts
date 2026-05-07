import { MsalOboService } from '../../auth/msalOboService';
import { userRepository, UserRepository } from './user.repository';
import jwt from 'jsonwebtoken';
import { config } from '../../config';

export class AuthService {
  constructor(
    private readonly users: UserRepository
  ) {}

  /**
   * Handles user login/registration after frontend authentication.
   * Verifies the token and creates/updates the user record.
   */
  async handleUserLogin(idToken: string, accessToken: string) {
    const decoded: any = jwt.decode(idToken);
    
    if (!decoded) {
      throw new Error('Invalid ID token');
    }

    // Personal Microsoft accounts (MSA) have oid starting with 00000000-0000-0000
    // Use 'sub' as the stable unique identifier for personal accounts.
    // Work/school accounts have a real oid — use that.
    const isPersonalAccount = !decoded.oid || decoded.oid.startsWith('00000000-0000-0000-');
    const microsoftId = isPersonalAccount ? decoded.sub : decoded.oid;

    const { name, preferred_username, tid } = decoded;

    if (!microsoftId) {
      throw new Error('Cannot determine user identity from token');
    }

    const user = await this.users.upsert(microsoftId, {
      microsoftId,
      displayName: name || preferred_username || 'Unknown',
      email: preferred_username || decoded.email || '',
      tenantId: tid || 'personal',
      accessToken,
    });

    const sessionToken = jwt.sign(
      { id: user._id, microsoftId: user.microsoftId, email: user.email },
      config.jwt.secret,
      { expiresIn: '24h' }
    );

    return { user, sessionToken };
  }

  /**
   * Helper to get an access token for Graph API on behalf of the user.
   */
  async getGraphToken(userAccessToken: string) {
    return MsalOboService.getGraphToken(userAccessToken);
  }
}

export const authService = new AuthService(userRepository);
