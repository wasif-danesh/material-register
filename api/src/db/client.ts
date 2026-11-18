import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../env.ts';
import * as schema from './schema.ts';

// One connection pool for the whole process. It is exported so scripts and tests can
// close it and let the process exit.
export const pool = new Pool({ connectionString: env.DATABASE_URL });

// Without a listener, an error on an idle connection (for example when the database
// restarts) is thrown as an uncaught exception and stops the whole process. The pool
// replaces the broken connection itself, so logging is all that is needed.
pool.on('error', (error) => {
  console.error('Idle database connection failed:', error.message);
});

export const db = drizzle({ client: pool, schema });
