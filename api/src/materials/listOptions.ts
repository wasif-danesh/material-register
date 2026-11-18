import { asc } from 'drizzle-orm';
import { db } from '../db/client.ts';
import { manufacturers, plants } from '../db/schema.ts';

/** The choices for the plant and manufacturer filters. Types and statuses are constants. */
export async function listOptions() {
  const [plantRows, manufacturerRows] = await Promise.all([
    db.select().from(plants).orderBy(asc(plants.code)),
    db.select().from(manufacturers).orderBy(asc(manufacturers.name)),
  ]);

  return { plants: plantRows, manufacturers: manufacturerRows };
}
