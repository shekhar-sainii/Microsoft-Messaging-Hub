import { Response } from 'express';
import { HttpStatus, ResponseMessages } from './constants';

export class ApiResponse {
    static success(res: Response, data: any = null, message: string = ResponseMessages.SUCCESS, status: number = HttpStatus.OK) {
        return res.status(status).json({
            success: true,
            message,
            data,
            timestamp: new Date().toISOString()
        });
    }

    static error(res: Response, error: any = ResponseMessages.ERROR, status: number = HttpStatus.INTERNAL_SERVER_ERROR) {
        return res.status(status).json({
            success: false,
            message: typeof error === 'string' ? error : error.message,
            error: process.env.NODE_ENV === 'development' ? error : undefined,
            timestamp: new Date().toISOString()
        });
    }
}
