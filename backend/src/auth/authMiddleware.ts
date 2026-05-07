import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

/**
 * Standard Authentication Middleware
 * Reads the session JWT from:
 *   1. httpOnly cookie `session_token` (preferred — never exposed to JS)
 *   2. Authorization: Bearer header (fallback for API clients / Postman)
 */
export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // 1. Try httpOnly cookie first
  let token = req.cookies?.session_token;

  // 2. Fallback to Authorization header (for Postman / API clients)
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'No session token provided' });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Session expired or invalid token' });
  }
};
