import { Request, Response } from 'express';
import { authService } from './auth.service';
import { ApiResponse } from '../../shared/ApiResponse';
import { HttpStatus, ResponseMessages } from '../../shared/constants';
import { AuthenticatedRequest } from '../../shared/types';

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { idToken, accessToken } = req.body;
      const result = await authService.handleUserLogin(idToken, accessToken);
      
      res.cookie('session_token', result.sessionToken, {
        httpOnly: true,
        secure: true, // MUST be true for SameSite='none' cross-origin cookies
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000
      });

      const userObj = result.user.toObject ? result.user.toObject() : result.user;
      return ApiResponse.success(res, { ...userObj, sessionToken: result.sessionToken }, ResponseMessages.AUTH_SUCCESS);
    } catch (error: any) {
      return ApiResponse.error(res, error, HttpStatus.UNAUTHORIZED);
    }
  }

  async getMe(req: AuthenticatedRequest, res: Response) {
    try {
      return ApiResponse.success(res, req.user, ResponseMessages.FETCHED);
    } catch (error: any) {
      return ApiResponse.error(res, error);
    }
  }

  async logout(req: any, res: Response) {
    res.clearCookie('session_token');
    return ApiResponse.success(res, null, ResponseMessages.LOGOUT_SUCCESS);
  }

  async adminConsent(req: Request, res: Response) {
    const { tenantId } = req.query;
    const url = authService.getAdminConsentUrl(tenantId as string);
    return res.redirect(url);
  }

  async handleAdminConsentCallback(req: Request, res: Response) {
    const { admin_consent, tenant, error, error_description } = req.query;
    
    if (error) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?error=${error_description}`);
    }

    // Redirect to frontend with success flag
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?consent=granted&tenant=${tenant}`);
  }

  async getGraphToken(req: AuthenticatedRequest, res: Response) {
    try {
        const token = await authService.getGraphToken(req.user.microsoftId);
        return res.json({ success: true, data: { accessToken: token } });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: 'Failed to fetch graph token' });
    }
  }
}

export const authController = new AuthController();
