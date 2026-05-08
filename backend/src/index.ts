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

const app = express();
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
  origin: config.env === 'production'
    ? [process.env.FRONTEND_URL || 'http://localhost', 'http://localhost:80']
    : ['http://localhost:5173', 'http://localhost', 'http://localhost:80'],
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());

// ── Session Management (Redis) ───────────────────────────────────────────────
import { RedisStore } from 'connect-redis';
const sessionRedisClient = createClient({
    socket: { host: config.redis.host, port: config.redis.port }
});
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

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api', apiRoutes);

// Swagger Documentation
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
