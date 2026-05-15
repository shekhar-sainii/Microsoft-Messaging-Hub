import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { userRepository } from '../../modules/auth/user.repository';
import { createGraphClient } from '../../config/graphClient';
import { logger } from '../../utils/logger';
import { ApiResponse } from '../ApiResponse';
import { HttpStatus, ResponseMessages } from '../constants';
import { AuthenticatedRequest } from '../types';
import { decryptToken } from '../../utils/tokenCrypto';

/**
 * Middleware that ensures we have a valid Graph client for the user.
 */
export const graphMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies?.session_token || req.headers.authorization?.split(' ')[1];

        if (!token) {
            return ApiResponse.error(res, ResponseMessages.NO_TOKEN, HttpStatus.UNAUTHORIZED);
        }

        const decoded: any = jwt.verify(token, config.jwt.secret as string);
        const user = await userRepository.findByMicrosoftId(decoded.microsoftId);

        if (!user) {
            return ApiResponse.error(res, ResponseMessages.USER_NOT_FOUND, HttpStatus.UNAUTHORIZED);
        }

        const accessToken = decryptToken(user.accessToken);

        if (!accessToken) {
            return ApiResponse.error(res, ResponseMessages.MS_TOKEN_FAILED, HttpStatus.UNAUTHORIZED);
        }

        try {
            req.graphClient = createGraphClient(accessToken);
        } catch (err) {
            logger.error('Failed to initialize Graph Client', err);
            return ApiResponse.error(res, ResponseMessages.MS_TOKEN_FAILED, HttpStatus.UNAUTHORIZED);
        }

        req.user = user;
        next();
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            return ApiResponse.error(res, ResponseMessages.SESSION_EXPIRED, HttpStatus.UNAUTHORIZED);
        }
        return ApiResponse.error(res, error);
    }
};
