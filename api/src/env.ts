import { existsSync } from 'node:fs';
import { z } from 'zod';

// Locally the settings live in the repository's root .env file. In CI and on Render
// there is no file and the variables are set by the platform, so loading is optional.
// Variables that are already set win over the file.
const envFile = new URL('../../.env', import.meta.url);
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

const envSchema = z.object({
  DATABASE_URL: z.url(),
  PORT: z.coerce.number().int().positive().default(3001),
  WEB_ORIGIN: z.url().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

// Fail at start-up with the names of the bad variables, instead of failing later on
// the first database call with a less helpful error.
if (!parsed.success) {
  console.error('Invalid environment variables:\n' + z.prettifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
