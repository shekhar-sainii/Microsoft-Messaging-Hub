import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

/**
 * Winston structured logger.
 * - Development: colorized, human-readable output
 * - Production/Test: structured JSON (stdout for container log aggregation)
 *
 * Every Graph API call MUST be logged with:
 *   logger.info('graph:call', { endpoint, method, durationMs, statusCode, xMsRequestId })
 */
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    process.env.NODE_ENV !== 'production'
      ? combine(
          colorize({ all: true }),
          printf(({ timestamp, level, message, ...meta }) => {
            const metaStr = Object.keys(meta).length
              ? `\n  ${JSON.stringify(meta, null, 2)}`
              : '';
            return `${timestamp} [${level}] ${message}${metaStr}`;
          })
        )
      : winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
  ],
  // Don't crash on uncaught exceptions in the logger itself
  exitOnError: false,
});

export { logger };
