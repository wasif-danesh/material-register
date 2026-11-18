import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../env.ts';
import * as schema from './schema.ts';

// One connection pool for the whole process. It is exported so scripts and tests can
// close it and let the process exit.
export const pool = new Pool({ connectionString: env.DATABASE_URL });

export const db = drizzle({ client: pool, schema });
