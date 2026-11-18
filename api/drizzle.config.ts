import { defineConfig } from 'drizzle-kit';

// Only used by `drizzle-kit generate`, which compares schema.ts with the existing
// migrations and writes the next SQL file. It never connects to the database, so no
// connection string is needed here. Applying migrations is done by src/db/migrate.ts.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
});
