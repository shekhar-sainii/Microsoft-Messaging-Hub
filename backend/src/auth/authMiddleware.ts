import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { ApiResponse } from '../shared/ApiResponse';
import { HttpStatus } from '../shared/constants';
import { AuthenticatedRequest } from '../shared/types';

/**
 * Standard Authentication Middleware
 */
export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let token = req.cookies?.session_token;

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    return ApiResponse.error(res, 'No session token provided', HttpStatus.UNAUTHORIZED);
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret as string);
    req.user = decoded;
    next();
  } catch (error) {
    return ApiResponse.error(res, 'Session expired or invalid token', HttpStatus.UNAUTHORIZED);
  }
};
