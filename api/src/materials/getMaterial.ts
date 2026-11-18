import { eq } from 'drizzle-orm';
import { db } from '../db/client.ts';
import { manufacturers, materials, plants } from '../db/schema.ts';
import { MATERIAL_FIELDS } from './materialFields.ts';

/** Returns one material, or undefined when no material has this id. */
export async function getMaterial(id: number) {
  const rows = await db
    .select(MATERIAL_FIELDS)
    .from(materials)
    .innerJoin(plants, eq(materials.plantId, plants.id))
    .leftJoin(manufacturers, eq(materials.manufacturerId, manufacturers.id))
    .where(eq(materials.id, id))
    .limit(1);

  return rows[0];
}
