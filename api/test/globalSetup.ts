import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Client, Pool } from 'pg';
import { resetDatabase } from './resetDatabase.ts';
import { TEST_DATABASE_URL } from './testDatabase.ts';

/** Runs once before all test files. */
export default async function setup() {
  const databaseName = new URL(TEST_DATABASE_URL).pathname.slice(1);

  // This setup deletes every row. Refuse to run against anything that is not clearly
  // a test database, in case the URL is ever misconfigured.
  if (!databaseName.endsWith('_test')) {
    throw new Error(`Refusing to run tests against "${databaseName}": the name must end in _test.`);
  }

  // A database cannot be created from inside itself, so connect to the server's
  // built-in "postgres" database to create the test one the first time.
  const adminUrl = new URL(TEST_DATABASE_URL);
  adminUrl.pathname = '/postgres';
  const admin = new Client({ connectionString: adminUrl.href });
  await admin.connect();
  const existing = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [
    databaseName,
  ]);
  if (existing.rowCount === 0) {
    // The name cannot be a query parameter here; it was checked above and comes from
    // our own configuration, not from user input.
    await admin.query(`CREATE DATABASE "${databaseName}"`);
  }
  await admin.end();

  const pool = new Pool({ connectionString: TEST_DATABASE_URL });
  const db = drizzle({ client: pool });

  // The same migrations the application uses, so the tests run against the real schema.
  await migrate(db, { migrationsFolder: new URL('../drizzle', import.meta.url).pathname });

  await resetDatabase(db);

  await pool.end();
}
