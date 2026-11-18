import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { manufacturers, materials, plants } from '../src/db/schema.ts';
import { MANUFACTURERS, MATERIALS, PLANTS } from './fixtures.ts';

/** Empties the tables and loads the fixtures again, with ids starting from 1. */
export async function resetDatabase(db: NodePgDatabase<Record<string, unknown>>) {
  await db.execute(sql`TRUNCATE ${materials}, ${plants}, ${manufacturers} RESTART IDENTITY`);
  await db.insert(plants).values(PLANTS);
  await db.insert(manufacturers).values(MANUFACTURERS);
  await db.insert(materials).values(MATERIALS);
}
