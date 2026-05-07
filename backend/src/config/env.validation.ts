import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Zod schema for all required environment variables.
 * The app will crash with a clear error message at startup if any are missing.
 * This prevents silent failures in production.
 */
const envSchema = z.object({
  // Server
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),

  // Azure AD
  TENANT_ID: z.string().min(1, 'TENANT_ID (Azure AD Tenant ID) is required'),
  CLIENT_ID: z.string().min(1, 'CLIENT_ID (Azure AD App Client ID) is required'),
  CLIENT_SECRET: z.string().min(1, 'CLIENT_SECRET must be set in .env — never commit the real value'),

  // Webhook
  WEBHOOK_URL: z.string().url('WEBHOOK_URL must be a valid HTTPS URL (use ngrok in development)').optional(),
  WEBHOOK_CLIENT_STATE: z.string().min(16, 'WEBHOOK_CLIENT_STATE must be at least 16 characters for HMAC security'),

  // RSA Keys
  RSA_PRIVATE_KEY_PATH: z.string().default('./certs/private.pem'),
  RSA_PUBLIC_KEY_PATH: z.string().default('./certs/public.pem'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),

  // Outgoing Webhook Bot (optional)
  TEAMS_OUTGOING_WEBHOOK_TOKEN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates and parses process.env against the schema.
 * Throws a detailed ZodError if validation fails.
 */
export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues
      .map((e: any) => `  ❌ ${e.path.join('.')}: ${e.message}`)
      .join('\n');

    console.error(
      `\n🚨 Environment Variable Validation Failed:\n${errors}\n\n` +
      `Please check your .env file against backend/.env.example\n`
    );
    process.exit(1);
  }

  return result.data;
}

export const env = validateEnv();
