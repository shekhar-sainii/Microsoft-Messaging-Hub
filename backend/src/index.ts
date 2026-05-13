import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { createClient } from 'redis';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { config } from './config';
import { connectDB } from './config/db';
import { redis } from './config/redis';
import { socketServer } from './socket/socketServer';
import { logger } from './utils/logger';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger.config';
import { errorHandler } from './shared/errorMiddleware';
import { csrfProtection, setCsrfToken } from './shared/middleware/security.middleware';
import apiRoutes from './routes';

// Background Workers & Services
import { startMessageWorker } from './modules/scheduler/workers/message.worker';
import { startWebhookWorker } from './modules/webhooks/webhook.worker';
import { webhookService } from './modules/webhooks/webhook.service';
import { templateService } from './modules/templates/template.service';

const app = express();

// Universal Top-Level Webhook Validation Handshake Interceptor
// Mounted at the VERY highest level before CORS filters, JSON body parsers, or Helmet policies
// to guarantee that Microsoft Graph validation probes (validationToken) are unconditionally answered
// with HTTP 200 plain text regardless of incoming request method, path aliases, or external origin headers.
app.use((req, res, next) => {
    if (req.query && req.query.validationToken) {
        return res.status(200).set('Content-Type', 'text/plain').send(req.query.validationToken as string);
    }
    next();
});

const httpServer = createServer(app);

// ── Security & Core Middleware ───────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://static.sharepointonline.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://graph.microsoft.com"],
      connectSrc: ["'self'", "https://graph.microsoft.com", "https://login.microsoftonline.com", "wss:", "ws:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: (origin, callback) => {
      // Allow server-to-server calls or local test tools
      if (!origin) return callback(null, true);
      // Resiliently whitelist Vercel edge CDN, local endpoints, and specific ENV mappings
      if (
          origin.includes('localhost') || 
          origin.includes('vercel.app') || 
          origin.includes('render.com') ||
          origin.includes('graph.microsoft.com') ||
          (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL)
      ) {
          return callback(null, true);
      }
      return callback(new Error('CORS Policy Rejection'), false);
  },
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());

// ── Session Management (Redis) ───────────────────────────────────────────────
import { RedisStore } from 'connect-redis';
const sessionRedisClient = config.redis.url 
    ? createClient({ 
        url: config.redis.url,
        socket: (config.redis.url.startsWith('rediss://') || config.redis.url.includes('upstash')) ? {
            tls: true,
            rejectUnauthorized: false
        } : undefined
      }) 
    : createClient({ socket: { host: config.redis.host, port: config.redis.port } });
sessionRedisClient.connect().catch(e => logger.error('Session Redis Error', e));

app.use(session({
    store: new RedisStore({ client: sessionRedisClient, prefix: 'sess:' }),
    secret: config.jwt.secret as string,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: config.env === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
    },
}));

// ── CSRF Protection ─────────────────────────────────────────────────────────
app.use(setCsrfToken);
app.use(csrfProtection);

// ── Services & Workers ──────────────────────────────────────────────────────
socketServer.initialize(httpServer);
startMessageWorker();
startWebhookWorker();

// Unconditional Server Startup DB Bootstrapper: Populates universal systemic template catalogs
// into live persistent MongoDB collections directly during primary server boot routines.
templateService.listTemplates('system').catch(err => logger.error('Startup Template Seed Error', err));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api', apiRoutes);

// Swagger Documentation
app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Messaging Hub — API Docs',
  customCss: '.swagger-ui .topbar { background: #0f172a; }',
}));

// Health Check
app.get('/api/health', async (_req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
  res.json({ 
    status: 'Operational', 
    timestamp: new Date().toISOString(),
    infrastructure: { mongodb: mongoStatus }
  });
});

// Global Error Handler
app.use(errorHandler);

// ── Bootstrap ────────────────────────────────────────────────────────────────
const bootstrap = async () => {
  try {
    await connectDB();
    
    // Sync missed notifications on startup
    webhookService.bootstrapDeltaCatchup().catch(err => {
        logger.error('Delta catch-up failed during bootstrap', err);
    });

    httpServer.listen(config.port, () => {
      logger.info(`🚀 Microsoft Messaging Hub active on port ${config.port} [${config.env}]`);
    });
  } catch (error: any) {
    logger.error('Failed to bootstrap application', error);
    process.exit(1);
  }
};

bootstrap();
