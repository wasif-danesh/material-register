import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './client.ts';

// Applies every SQL file in api/drizzle that this database has not run yet. Drizzle
// records what has run in its own table, so the script is safe to run repeatedly.
const migrationsFolder = new URL('../../drizzle', import.meta.url).pathname;

await migrate(db, { migrationsFolder });
console.log('Migrations applied.');
await pool.end();
