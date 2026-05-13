import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

/**
 * OpenAPI 3.1 base configuration.
 */
const swaggerDefinition: swaggerJsdoc.OAS3Definition = {
  openapi: '3.1.0',
  info: {
    title: 'Microsoft Messaging Hub — REST API',
    version: '1.0.0',
    description: `
A production-grade API for browsing Microsoft Teams, composing rich messages
(plain text + Adaptive Cards), scheduling messages via BullMQ, and receiving
real-time reply notifications via Graph webhooks.

## Authentication

All protected routes require a session token obtained from \`POST /api/auth/msal-token\`.
The token is typically set in an httpOnly cookie, but can also be passed in the
Authorization header for API testing.

\`\`\`
Authorization: Bearer <session_token>
\`\`\`
    `,
    contact: {
      name: 'API Support',
      email: 'developer@qservicesit.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Session JWT obtained from POST /api/auth/msal-token',
      },
    },
  },
  security: [{ BearerAuth: [] }],
  tags: [
    { name: 'Auth', description: 'Authentication & session management' },
    { name: 'Teams', description: 'Microsoft Teams & Channel browser' },
    { name: 'Messages', description: 'Message composer, history, and search' },
    { name: 'Scheduler', description: 'Scheduled & recurring message jobs' },
    { name: 'Templates', description: 'Adaptive Card template library' },
    { name: 'Subscriptions', description: 'Microsoft Graph webhooks' },
    { name: 'Analytics', description: 'Usage stats and audit trail' },
  ],
};

const options: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  apis: [
    path.join(__dirname, 'swagger/*.doc.{ts,js}'),
    path.join(__dirname, 'schemas/*.{ts,js}'),
    path.join(__dirname, '../index.{ts,js}'),
    // Fallback production container absolute mapping paths ensuring raw JSDoc parsing resolution:
    path.resolve(__dirname, '../../src/docs/swagger/*.doc.{ts,js}'),
    path.resolve(__dirname, '../../src/docs/schemas/*.{ts,js}'),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
