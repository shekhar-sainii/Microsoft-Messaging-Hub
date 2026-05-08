import { Request } from 'express';
import { Client } from '@microsoft/microsoft-graph-client';

export interface AuthenticatedRequest extends Request {
    user?: any;
    graphClient?: Client;
}
