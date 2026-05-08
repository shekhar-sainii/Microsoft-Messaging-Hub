export enum HttpStatus {
    OK = 200,
    CREATED = 201,
    ACCEPTED = 202,
    NO_CONTENT = 204,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    CONFLICT = 409,
    INTERNAL_SERVER_ERROR = 500,
}

export const ResponseMessages = {
    // Generic
    SUCCESS: 'Operation completed successfully',
    CREATED: 'Resource created successfully',
    UPDATED: 'Resource updated successfully',
    DELETED: 'Resource deleted successfully',
    FETCHED: 'Data retrieved successfully',
    ERROR: 'An unexpected error occurred',
    NOT_FOUND: 'Resource not found',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Action forbidden',
    BAD_REQUEST: 'Invalid request data',

    // Auth
    AUTH_SUCCESS: 'Authentication successful',
    LOGOUT_SUCCESS: 'Logged out successfully',
    SESSION_EXPIRED: 'Session expired or invalid token',
    NO_TOKEN: 'No session token provided',
    USER_NOT_FOUND: 'User not found — please sign in again',
    MS_TOKEN_FAILED: 'Failed to acquire Microsoft token',

    // Templates & Assets
    TEMPLATE_SAVED: 'Asset archived in repository',
    TEMPLATE_DELETED: 'Asset removed from repository',
    SYSTEM_TEMPLATE_PROTECTED: 'System assets are read-only',

    // Messaging
    MESSAGE_SENT: 'Communication dispatched successfully',
    MESSAGE_FAILED: 'Communication dispatch failed',
    RETRY_SUCCESS: 'Retry attempt successful',
    INVALID_CARD: 'Adaptive Card schema validation failed',

    // Scheduler
    ONLY_PENDING_ALLOWED: 'Only pending messages can be modified',

    // Admin & Multi-tenant
    CONSENT_GRANTED: 'Admin consent processed successfully',
    TENANT_LISTED: 'Tenant information retrieved',
};
