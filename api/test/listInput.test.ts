import { listMaterialsInputSchema } from '@material-register/shared';
import { describe, expect, it } from 'vitest';
import { appRouter } from '../src/router.ts';

describe('list input validation', () => {
  it('fills in every default for an empty input', () => {
    expect(listMaterialsInputSchema.parse({})).toEqual({
      search: '',
      types: [],
      statuses: [],
      plantIds: [],
      manufacturerIds: [],
      sortBy: 'updatedAt',
      sortDir: 'desc',
      page: 1,
      pageSize: 25,
    });
  });

  it('trims the search text', () => {
    expect(listMaterialsInputSchema.parse({ search: '  bearing ' }).search).toBe('bearing');
  });

  it.each([
    ['a sort column that is not on the allow-list', { sortBy: 'password' }],
    ['a sort direction other than asc or desc', { sortDir: 'sideways' }],
    ['a page size outside the fixed set', { pageSize: 7 }],
    ['page zero', { page: 0 }],
    ['a fractional page', { page: 1.5 }],
    ['an unknown material type', { types: ['Widget'] }],
    ['an unknown status', { statuses: ['Deleted'] }],
    ['an id that is not a number', { plantIds: ['1; DROP TABLE materials'] }],
    ['a search longer than 100 characters', { search: 'a'.repeat(101) }],
  ])('rejects %s', (_name, input) => {
    expect(listMaterialsInputSchema.safeParse(input).success).toBe(false);
  });
});

describe('materials.list procedure', () => {
  // Calls the procedure directly, without HTTP, to prove validation is wired into it.
  const caller = appRouter.createCaller({});

  it('rejects invalid input with a BAD_REQUEST error', async () => {
    await expect(caller.materials.list({ sortBy: 'password' } as never)).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    });
  });

  it('returns a page for valid input', async () => {
    const result = await caller.materials.list({ search: 'bearing' });

    expect(result.total).toBe(2);
  });
});

describe('meta.options procedure', () => {
  it('returns plants by code and manufacturers by name', async () => {
    const options = await appRouter.createCaller({}).meta.options();

    expect(options.plants.map((plant) => plant.code)).toEqual(['1000', '2000']);
    expect(options.manufacturers.map((maker) => maker.name)).toEqual(['Gates', 'SKF']);
  });
});
