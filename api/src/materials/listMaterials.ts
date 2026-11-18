import type { ListMaterialsInput, SortField } from '@material-register/shared';
import { and, asc, count, desc, eq, ilike, inArray, or, type SQL } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';
import { db } from '../db/client.ts';
import { manufacturers, materials, plants } from '../db/schema.ts';

// Maps each allowed sort name to its column. Validation has already limited `sortBy`
// to these names, so user input never chooses a column directly.
const SORT_COLUMNS: Record<SortField, PgColumn> = {
  materialNumber: materials.materialNumber,
  description: materials.description,
  unitPrice: materials.unitPrice,
  quantityOnHand: materials.quantityOnHand,
  updatedAt: materials.updatedAt,
};

/**
 * Turns the user's text into an ILIKE pattern that matches it anywhere in a column.
 * `%` and `_` are wildcards in LIKE, so they are escaped: a search for "50%" should
 * find that text, not everything starting with "50".
 */
function containsPattern(text: string): string {
  return `%${text.replace(/[\\%_]/g, '\\$&')}%`;
}

/** Builds the WHERE clause shared by the page query and the count query. */
function buildWhere(input: ListMaterialsInput): SQL | undefined {
  const pattern = input.search ? containsPattern(input.search) : null;

  // `and` skips undefined entries, so each filter is simply left out when not used.
  // Values inside one filter are alternatives (IN); the filters and the search must
  // all hold (AND).
  return and(
    pattern
      ? or(
          ilike(materials.materialNumber, pattern),
          ilike(materials.description, pattern),
          ilike(materials.manufacturerPartNumber, pattern),
        )
      : undefined,
    input.types.length > 0 ? inArray(materials.materialType, input.types) : undefined,
    input.statuses.length > 0 ? inArray(materials.status, input.statuses) : undefined,
    input.plantIds.length > 0 ? inArray(materials.plantId, input.plantIds) : undefined,
    input.manufacturerIds.length > 0
      ? inArray(materials.manufacturerId, input.manufacturerIds)
      : undefined,
  );
}

/**
 * Returns one page of materials plus the total number that match. A page past the end
 * returns no items but still the real total, so the caller can offer the last page.
 */
export async function listMaterials(input: ListMaterialsInput) {
  const where = buildWhere(input);
  const direction = input.sortDir === 'asc' ? asc : desc;

  const [items, totals] = await Promise.all([
    db
      .select({
        id: materials.id,
        materialNumber: materials.materialNumber,
        description: materials.description,
        materialType: materials.materialType,
        status: materials.status,
        manufacturerPartNumber: materials.manufacturerPartNumber,
        unitOfMeasure: materials.unitOfMeasure,
        unitPrice: materials.unitPrice,
        quantityOnHand: materials.quantityOnHand,
        updatedAt: materials.updatedAt,
        plant: { id: plants.id, code: plants.code, name: plants.name },
        manufacturer: { id: manufacturers.id, name: manufacturers.name },
      })
      .from(materials)
      .innerJoin(plants, eq(materials.plantId, plants.id))
      // Left join: raw materials have no manufacturer and must still be listed.
      .leftJoin(manufacturers, eq(materials.manufacturerId, manufacturers.id))
      .where(where)
      // Many rows share a price or a description. Without a second, unique sort column
      // their order is undefined and a row could appear on two pages or on none.
      .orderBy(direction(SORT_COLUMNS[input.sortBy]), direction(materials.id))
      .limit(input.pageSize)
      .offset((input.page - 1) * input.pageSize),
    // The count needs the same filters but no joins, sorting or paging.
    db.select({ total: count() }).from(materials).where(where),
  ]);

  const total = totals[0]?.total ?? 0;

  return {
    items,
    total,
    page: input.page,
    pageSize: input.pageSize,
    pageCount: Math.ceil(total / input.pageSize),
  };
}
