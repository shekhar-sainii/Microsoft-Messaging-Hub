import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../shared/ApiResponse';
import { HttpStatus } from '../shared/constants';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(`[Error] ${req.method} ${req.url}:`, err);

    // Mongoose Validation Error
    if (err.name === 'ValidationError') {
        return ApiResponse.error(res, err.message, HttpStatus.BAD_REQUEST);
    }

    // Mongoose Duplicate Key Error
    if (err.code === 11000) {
        return ApiResponse.error(res, 'Duplicate resource found', HttpStatus.CONFLICT);
    }

    // Default Error
    return ApiResponse.error(
        res, 
        err.message || 'Internal Server Error', 
        err.status || HttpStatus.INTERNAL_SERVER_ERROR
    );
};
