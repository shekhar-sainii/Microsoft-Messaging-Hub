import swaggerJsdoc from 'swagger-jsdoc';

/**
 * OpenAPI 3.1 base configuration.
 * Route-level documentation is written as JSDoc in each module's routes file,
 * and shared schemas are defined in src/docs/schemas/.
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

All protected routes require a \`Bearer\` token obtained from \`POST /api/auth/msal-token\`.

\`\`\`
Authorization: Bearer <session_token>
\`\`\`

The session token is a JWT issued by this backend after completing the
**On-Behalf-Of (OBO)** token exchange with Microsoft Graph.
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
    {
      url: 'https://your-production-domain.com/api',
      description: 'Production Server',
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
    { name: 'Auth', description: 'Authentication & session management (MSAL OBO flow)' },
    { name: 'Teams', description: 'Microsoft Teams & Channel browser' },
    { name: 'Messages', description: 'Message composer, history, search, and replies' },
    { name: 'Scheduler', description: 'BullMQ-based scheduled & recurring message jobs' },
    { name: 'Templates', description: 'Adaptive Card template library (CRUD)' },
    { name: 'Subscriptions', description: 'Microsoft Graph Change Notification subscriptions' },
    { name: 'Analytics', description: 'Sent message stats, failure logs, audit trail' },
    { name: 'Bot', description: 'Outgoing Webhook command handler + Adaptive Card Action.Submit' },
    { name: 'Health', description: 'Liveness probe' },
  ],
};

const options: swaggerJsdoc.Options = {
  definition: swaggerDefinition,
  // Glob patterns — swagger-jsdoc scans these files for @swagger JSDoc blocks
  apis: [
    './src/modules/*/**.routes.ts',
    './src/modules/bot/bot.routes.ts',
    './src/docs/schemas/*.ts',
    './src/index.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
