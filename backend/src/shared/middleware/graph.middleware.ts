import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { userRepository } from '../../modules/auth/user.repository';
import { MsalOboService } from '../../auth/msalOboService';
import { Client } from '@microsoft/microsoft-graph-client';
import { createGraphClient } from '../../config/graphClient';
import { logger } from '../../utils/logger';

export interface AuthenticatedRequest extends Request {
    graphClient?: Client;
    user?: any;
}

/**
 * Graph Middleware
 *
 * Token strategy:
 * 1. Try OBO exchange (works for work/school accounts)
 * 2. If OBO fails (personal accounts don't support OBO), use the stored
 *    accessToken directly — it already has Graph scopes from the frontend login
 */
export const graphMiddleware = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        // 1. Read session token from httpOnly cookie or Authorization header
        let sessionToken = req.cookies?.session_token;
        if (!sessionToken) {
            const authHeader = req.headers.authorization;
            if (authHeader?.startsWith('Bearer ')) {
                sessionToken = authHeader.split(' ')[1];
            }
        }

        if (!sessionToken) {
            return res.status(401).json({ error: 'No session token provided' });
        }

        // 2. Verify session JWT
        const decoded: any = jwt.verify(sessionToken, config.jwt.secret);
        if (!decoded?.microsoftId) {
            return res.status(401).json({ error: 'Invalid session token' });
        }

        // 3. Load user from DB
        const user = await userRepository.findByMicrosoftId(decoded.microsoftId);
        if (!user) {
            return res.status(401).json({ error: 'User not found — please sign in again' });
        }

        if (!user.accessToken) {
            return res.status(401).json({ error: 'No Microsoft token — please sign in again' });
        }

        // 4. Try OBO first (works for work/school M365 accounts)
        //    Fall back to direct token use for personal accounts (OBO not supported)
        let graphToken: string | null = null;

        try {
            graphToken = await MsalOboService.getGraphToken(user.accessToken);
        } catch (_) {
            // OBO failed — will try direct token below
        }

        if (!graphToken) {
            // Personal accounts: use the accessToken directly.
            // It was acquired with Graph scopes (User.Read, Team.ReadBasic.All etc.)
            // so it works directly against Graph API.
            logger.info('OBO unavailable — using direct token for Graph', {
                microsoftId: user.microsoftId,
            });
            graphToken = user.accessToken;
        }

        req.graphClient = createGraphClient(graphToken);
        req.user = user;

        next();
    } catch (error: any) {
        logger.error('Graph middleware error', { message: error.message });
        return res.status(401).json({ error: 'Authentication failed: ' + error.message });
    }
};
