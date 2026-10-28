import { z } from 'zod';
import { AI } from '@history-learning/shared';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  WEB_ORIGIN: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z.string().url(),
  TEST_DATABASE_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('7d'),
  COOKIE_NAME: z.string().default('access_token'),
  COOKIE_DOMAIN: z.string().optional(),
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default('"History Learning" <no-reply@localhost>'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  AI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().optional(),
  AI_EMBEDDING_MODEL: z.string().optional(),
  AI_TIMEOUT_MS: z.coerce.number().default(30000),
  AI_SIMILARITY_THRESHOLD: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : val),
    z.coerce
      .number({ message: 'AI_SIMILARITY_THRESHOLD phải là số' })
      .min(0, 'AI_SIMILARITY_THRESHOLD phải nằm trong khoảng 0..1')
      .max(1, 'AI_SIMILARITY_THRESHOLD phải nằm trong khoảng 0..1')
      .default(AI.SIMILARITY_THRESHOLD),
  ),
  SEED_ADMIN_EMAIL: z.string().email().optional(),
  SEED_ADMIN_PASSWORD: z.string().optional(),
  SEED_USER_EMAIL: z.string().email().optional(),
  SEED_USER_PASSWORD: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;
