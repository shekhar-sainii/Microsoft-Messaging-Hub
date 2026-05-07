import { Request, Response } from 'express';
import { authService } from './auth.service';
import { AuthenticatedRequest } from '../../shared/middleware/graph.middleware';
import { redis } from '../../config/redis';

export class AuthController {
  /**
   * Exchange MSAL access_token for backend session token (OBO Flow).
   * Sets the session JWT as an httpOnly cookie (never exposed to JS/localStorage).
   */
  async msalTokenExchange(req: Request, res: Response) {
    try {
      const { idToken, accessToken } = req.body;
      
      if (!idToken || !accessToken) {
        return res.status(400).json({ error: 'Missing MSAL tokens' });
      }

      const result = await authService.handleUserLogin(idToken, accessToken);

      // Set session token as httpOnly cookie — never exposed to localStorage
      res.cookie('session_token', result.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',   // 'lax' works for localhost:5173 → localhost:3000
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      // Return user profile but NOT the raw token
      res.json({ user: result.user });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get current user profile — merges local DB data with Graph /me
   * Also tracks recent channels in Redis (7-day expiry, last 5)
   */
  async getMe(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user;

      // Fetch Graph /me for live displayName, avatar, tenant info
      let graphProfile: any = null;
      try {
        if (req.graphClient) {
          graphProfile = await req.graphClient.api('/me')
            .select('id,displayName,mail,userPrincipalName,jobTitle,officeLocation')
            .get();
        }
      } catch (_) {
        // Graph call optional — return local data if it fails
      }

      // Fetch recent channels from Redis
      const recentKey = `recent:channels:${user.microsoftId}`;
      const recentRaw = await redis.get(recentKey);
      const recentChannels = recentRaw ? JSON.parse(recentRaw) : [];

      res.json({
        user: {
          ...user.toObject?.() ?? user,
          displayName: graphProfile?.displayName || user.displayName,
          email: graphProfile?.mail || graphProfile?.userPrincipalName || user.email,
          jobTitle: graphProfile?.jobTitle,
          officeLocation: graphProfile?.officeLocation,
        },
        recentChannels,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Logout and clear session
   */
  async logout(req: AuthenticatedRequest, res: Response) {
    try {
        if (req.user?.microsoftId) {
            await redis.del(`msal_cache`);
        }
        // Clear the httpOnly session cookie
        res.clearCookie('session_token', { httpOnly: true, sameSite: 'strict' });
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
  }
}

export const authController = new AuthController();
