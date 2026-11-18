import { count, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db, pool } from './client.ts';
import { manufacturers, materials, plants } from './schema.ts';
import { MANUFACTURERS, PLANTS } from './seed/catalogue.ts';
import { generateMaterials } from './seed/generate.ts';

// Usage: npm run db:seed            (10,000 materials)
//        npm run db:seed -- 200000  (a larger set, used to measure search speed)
const total = z.coerce.number().int().min(1).max(1_000_000).default(10_000).parse(process.argv[2]);

// 1,000 rows of 12 values is far below Postgres's limit of 65,535 values per statement.
const BATCH_SIZE = 1000;

// One transaction: if anything fails, the database keeps the data it had before.
await db.transaction(async (tx) => {
  // The script replaces all data, so it is safe to run again. RESTART IDENTITY resets
  // the id counters, which keeps ids the same from one run to the next.
  await tx.execute(sql`TRUNCATE ${materials}, ${plants}, ${manufacturers} RESTART IDENTITY`);

  const plantRows = await tx
    .insert(plants)
    .values(PLANTS.map(({ code, name }) => ({ code, name })))
    .returning();
  const manufacturerRows = await tx
    .insert(manufacturers)
    .values(MANUFACTURERS.map((name) => ({ name })))
    .returning();

  // The generator names plants and makers; these maps turn the names into foreign keys.
  const plantIdByCode = new Map(plantRows.map((plant) => [plant.code, plant.id]));
  const manufacturerIdByName = new Map(manufacturerRows.map((maker) => [maker.name, maker.id]));

  const rows = generateMaterials(total).map(({ plantCode, manufacturerName, ...material }) => ({
    ...material,
    plantId: plantIdByCode.get(plantCode)!,
    manufacturerId: manufacturerName ? manufacturerIdByName.get(manufacturerName)! : null,
  }));

  for (let start = 0; start < rows.length; start += BATCH_SIZE) {
    await tx.insert(materials).values(rows.slice(start, start + BATCH_SIZE));
  }
});

// Print a summary so a wrong spread is noticed straight away.
const byStatus = await db
  .select({ status: materials.status, materials: count() })
  .from(materials)
  .groupBy(materials.status)
  .orderBy(materials.status);
const byType = await db
  .select({ type: materials.materialType, materials: count() })
  .from(materials)
  .groupBy(materials.materialType)
  .orderBy(materials.materialType);

console.log(
  `Seeded ${total} materials, ${PLANTS.length} plants, ${MANUFACTURERS.length} manufacturers.`,
);
console.table(byStatus);
console.table(byType);

await pool.end();
