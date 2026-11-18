import { listMaterialsInputSchema } from '@material-register/shared';
import { describe, expect, it } from 'vitest';
import { listMaterials } from '../src/materials/listMaterials.ts';

/** Calls the query the way the API does: through validation, so defaults are applied. */
function list(input: Record<string, unknown> = {}) {
  return listMaterials(listMaterialsInputSchema.parse(input));
}

/** The ids of the returned rows, in order. Fixture ids are 1 to 12 (see fixtures.ts). */
async function ids(input: Record<string, unknown> = {}) {
  return (await list(input)).items.map((item) => item.id);
}

describe('defaults', () => {
  it('returns the first page, newest first', async () => {
    const result = await list();

    expect(result.total).toBe(12);
    expect(result.pageCount).toBe(1);
    expect(result.items.map((item) => item.id)).toEqual([12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
  });

  it('includes the plant, and a manufacturer of null for raw materials', async () => {
    const result = await list({ types: ['Raw Material'] });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      materialNumber: 'MAT-000005',
      plant: { code: '1000', name: 'Brisbane' },
      manufacturer: null,
      manufacturerPartNumber: null,
    });
  });
});

describe('search', () => {
  it('matches the description, ignoring case', async () => {
    expect(await ids({ search: 'BEARING' })).toEqual([2, 1]);
  });

  it('matches part of a material number', async () => {
    expect(await ids({ search: 'mat-000007' })).toEqual([7]);
  });

  it('matches the manufacturer part number', async () => {
    expect(await ids({ search: '6205' })).toEqual([1]);
  });

  it('returns a row when any one of the three columns matches', async () => {
    // Row 3 has "belt" in its description, row 4 only in its part number.
    expect(await ids({ search: 'belt' })).toEqual([4, 3]);
  });

  it('treats % and _ as ordinary characters, not wildcards', async () => {
    expect(await ids({ search: '50%' })).toEqual([6]);
    expect(await ids({ search: 'A_B' })).toEqual([7]);
    // As wildcards these would match every row.
    expect(await ids({ search: '%' })).toEqual([6]);
    expect(await ids({ search: '_' })).toEqual([7]);
  });

  it('returns nothing, with a total of zero, when there is no match', async () => {
    const result = await list({ search: 'no such part' });

    expect(result).toMatchObject({ items: [], total: 0, pageCount: 0 });
  });
});

describe('filters', () => {
  it('filters by one status', async () => {
    expect(await ids({ statuses: ['Obsolete'] })).toEqual([11, 2]);
  });

  it('treats several values in one filter as alternatives', async () => {
    expect(await ids({ statuses: ['Obsolete', 'Pending Review'] })).toEqual([11, 7, 2]);
  });

  it('requires every filter to match', async () => {
    // Obsolete rows are 2 and 11; only row 2 is at Sydney (plant 2).
    expect(await ids({ statuses: ['Obsolete'], plantIds: [2] })).toEqual([2]);
  });

  it('filters by manufacturer and leaves out materials without one', async () => {
    expect(await ids({ manufacturerIds: [2] })).toEqual([4, 3]);
  });

  it('combines search with filters', async () => {
    // Both bearings match the search; only row 1 is Active.
    expect(await ids({ search: 'bearing', statuses: ['Active'] })).toEqual([1]);
  });
});

describe('sorting', () => {
  it('sorts by price as a number, in both directions', async () => {
    // As text, "2500.00" would sort before "10.00".
    expect((await ids({ sortBy: 'unitPrice', sortDir: 'asc' }))[0]).toBe(10);
    expect((await ids({ sortBy: 'unitPrice', sortDir: 'desc' }))[0]).toBe(9);
  });

  it('breaks ties by id, in the same direction as the sort', async () => {
    // Ten rows cost 10.00. Their order must be fixed, not left to the database.
    expect(await ids({ sortBy: 'unitPrice', sortDir: 'asc' })).toEqual([
      10, 1, 2, 3, 4, 5, 6, 7, 8, 11, 12, 9,
    ]);
    expect(await ids({ sortBy: 'unitPrice', sortDir: 'desc' })).toEqual([
      9, 12, 11, 8, 7, 6, 5, 4, 3, 2, 1, 10,
    ]);
  });

  it('sorts by quantity on hand', async () => {
    const sorted = await ids({ sortBy: 'quantityOnHand', sortDir: 'desc' });

    expect(sorted[0]).toBe(10);
    expect(sorted.at(-1)).toBe(9);
  });
});

describe('pagination', () => {
  it('shows every row exactly once across pages, even when the sort column has ties', async () => {
    const input = { sortBy: 'unitPrice', sortDir: 'asc', pageSize: 10 };
    const firstPage = await list({ ...input, page: 1 });
    const secondPage = await list({ ...input, page: 2 });

    expect(firstPage.pageCount).toBe(2);
    expect(firstPage.items).toHaveLength(10);
    expect(secondPage.items).toHaveLength(2);

    const seen = [...firstPage.items, ...secondPage.items].map((item) => item.id);
    expect(new Set(seen).size).toBe(12);
  });

  it('returns no rows but the real total for a page past the end', async () => {
    const result = await list({ page: 5, pageSize: 10 });

    expect(result).toMatchObject({ items: [], total: 12, page: 5, pageCount: 2 });
  });

  it('counts only the rows that match the filters', async () => {
    const result = await list({ types: ['Consumable'] });

    expect(result.total).toBe(3);
  });
});
