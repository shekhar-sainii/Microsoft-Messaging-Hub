import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { createClient } from 'redis';
import mongoose from 'mongoose';
import { createServer } from 'http';
import crypto from 'crypto';
import { config } from './config';
import { connectDB } from './config/db';
import { redis } from './config/redis';
import { socketServer } from './socket/socketServer';
import { logger } from './utils/logger';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger.config';

// Module Routes
import authRoutes from './modules/auth/auth.routes';
import teamsRoutes from './modules/teams/teams.routes';
import messagesRoutes from './modules/messages/messages.routes';
import webhookRoutes from './modules/webhooks/webhook.routes';
import schedulerRoutes from './modules/scheduler/scheduler.routes';
import templateRoutes from './modules/templates/template.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import favouriteRoutes from './modules/favourites/favourite.routes';
import botRoutes from './modules/bot/bot.routes';

// Background Workers
import { startMessageWorker } from './modules/scheduler/workers/message.worker';
import { startWebhookWorker } from './modules/webhooks/webhook.worker';

const app = express();
const httpServer = createServer(app);

// ── CSRF Token Middleware ────────────────────────────────────────────────────
// Generates a per-request CSRF token and sets it as a cookie.
// The frontend must echo it back in the X-CSRF-Token header on mutating requests.
const csrfProtection = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Skip CSRF for GET/HEAD/OPTIONS and the public webhook receiver
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  const publicPaths = ['/webhook/graph', '/api/health', '/api/docs'];

  if (safeMethods.includes(req.method) || publicPaths.some(p => req.path.startsWith(p))) {
    return next();
  }

  // Skip CSRF for the initial auth token exchange (frontend can't have token yet)
  if (req.path === '/api/auth/msal-token') {
    return next();
  }

  const csrfCookie = req.cookies?.['csrf-token'];
  const csrfHeader = req.headers['x-csrf-token'];

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    logger.warn('CSRF validation failed', { path: req.path, method: req.method });
    return res.status(403).json({ error: 'CSRF token mismatch' });
  }

  next();
};

// Issue a CSRF token cookie on every response
const setCsrfToken = (_req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!_req.cookies?.['csrf-token']) {
    const token = crypto.randomBytes(32).toString('hex');
    res.cookie('csrf-token', token, {
      httpOnly: false,   // Must be readable by JS to send in header
      sameSite: 'lax',   // 'lax' allows cross-origin GET, works for localhost dev
      secure: config.env === 'production',
    });
  }
  next();
};

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://static.sharepointonline.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://graph.microsoft.com"],
      connectSrc: [
        "'self'",
        "https://graph.microsoft.com",
        "https://login.microsoftonline.com",
        "wss:",
        "ws:",
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Required for OneDrive SDK
}));

app.use(cors({
  origin: config.env === 'production'
    ? process.env.FRONTEND_URL || 'http://localhost:80'
    : ['http://localhost:5173', 'http://localhost:80'],
  credentials: true,
}));

// Cookie parser needed for CSRF
app.use(cookieParser());

// ── Session Middleware (express-session + Redis store) ───────────────────────
// Required by task spec. Complements the JWT httpOnly cookie approach.
// Used for MSAL token cache persistence and session state.
import { RedisStore } from 'connect-redis';
const sessionRedisClient = createClient({
    socket: { host: config.redis.host, port: config.redis.port }
});
sessionRedisClient.connect().catch(console.error);

app.use(session({
    store: new RedisStore({ client: sessionRedisClient, prefix: 'sess:' }),
    secret: config.jwt.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: config.env === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
}));

app.use(setCsrfToken);
app.use(csrfProtection);
app.use(express.json());

// ── Swagger API Docs ────────────────────────────────────────────────────────
// Available at: http://localhost:3000/api/docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Messaging Hub — API Docs',
  customCss: '.swagger-ui .topbar { background: #0f172a; }',
  swaggerOptions: {
    persistAuthorization: true, // Remember Bearer token across page refreshes
    displayRequestDuration: true,
  },
}));

// Raw OpenAPI JSON (useful for code generation)
app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));
// ────────────────────────────────────────────────────────────────────────────

// Initialize Core Services
socketServer.initialize(httpServer);
startMessageWorker();
startWebhookWorker();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/schedule', schedulerRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/subscriptions', webhookRoutes); // Mount subscriptions at /api/subscriptions
app.use('/api/analytics', analyticsRoutes);
app.use('/api/audit', analyticsRoutes);   // Task spec requires /api/audit separately
app.use('/api/favourites', favouriteRoutes);
app.use('/api/bot', botRoutes); // Outgoing Webhook + Card Action.Submit
app.use('/webhook', webhookRoutes); // Public webhook receiver

// Health Check
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Liveness & readiness probe
 *     description: Returns the connection status of MongoDB and Redis. Safe to call without authentication.
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: System health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: Operational
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 infrastructure:
 *                   type: object
 *                   properties:
 *                     mongodb:
 *                       type: string
 *                       enum: [Connected, Disconnected]
 *                     redis:
 *                       type: string
 *                       enum: [Connected, Disconnected]
 */
app.get('/api/health', async (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  let redisStatus = 'Disconnected';
  try {
      const pong = await redis.ping();
      if (pong === 'PONG') redisStatus = 'Connected';
  } catch (e) {}

  res.json({ 
    status: 'Operational', 
    timestamp: new Date().toISOString(),
    environment: config.env,
    infrastructure: {
        mongodb: mongoStatus,
        redis: redisStatus
    }
  });
});

/**
 * Bootstrap Application
 */
const bootstrap = async () => {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Start HTTP & Socket Server
    httpServer.listen(config.port, () => {
      logger.info(`🚀 Microsoft Messaging Hub active on port ${config.port} [${config.env}]`);
    });
  } catch (error: any) {
    logger.error('Failed to bootstrap application', error);
    process.exit(1);
  }
};

bootstrap();
