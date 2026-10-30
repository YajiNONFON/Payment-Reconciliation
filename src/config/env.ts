import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5001),
});

// DATABASE_URL is read lazily in lib/prisma.ts so that code paths that never
// touch the database (and their tests) do not need it.
export const env = envSchema.parse(process.env);
