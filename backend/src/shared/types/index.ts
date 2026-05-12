import { Request } from 'express';
import { Client } from '@microsoft/microsoft-graph-client';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        microsoftId: string;
        tenantId: string;
        role: 'admin' | 'manager' | 'member';
    } | any;
    graphClient?: Client;
}
