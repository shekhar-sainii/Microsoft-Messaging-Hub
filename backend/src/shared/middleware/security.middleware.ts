import express from 'express';
import crypto from 'crypto';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import { ApiResponse } from '../ApiResponse';
import { HttpStatus } from '../constants';

/**
 * CSRF Protection Middleware
 */
export const csrfProtection = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  const publicPaths = [
    '/api/webhook',
    '/api/health', 
    '/api/docs', 
    '/api/bot',
    '/webhook'
  ];

  if (safeMethods.includes(req.method) || publicPaths.some(p => req.path.startsWith(p))) {
    return next();
  }

  if (req.path.includes('/api/auth/msal-token')) {
    return next();
  }

  const csrfCookie = req.cookies?.['csrf-token'];
  const csrfHeader = req.headers['x-csrf-token'];

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    logger.warn('CSRF validation failed', { path: req.path, method: req.method });
    return ApiResponse.error(res, 'CSRF token mismatch', HttpStatus.FORBIDDEN);
  }

  next();
};

/**
 * CSRF Token Setter
 */
export const setCsrfToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.cookies?.['csrf-token']) {
    const token = crypto.randomBytes(32).toString('hex');
    res.cookie('csrf-token', token, {
      httpOnly: false,
      secure: true,
      sameSite: config.env === 'production' ? 'none' : 'lax',
    });
  }
  next();
};
