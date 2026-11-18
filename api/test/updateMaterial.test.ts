import { afterEach, describe, expect, it } from 'vitest';
import { db } from '../src/db/client.ts';
import { appRouter } from '../src/router.ts';
import { resetDatabase } from './resetDatabase.ts';

const caller = appRouter.createCaller({});

// Fixture row 1, as an edit form would submit it unchanged.
const ROW_ONE = {
  id: 1,
  description: 'Bearing, deep groove ball, 25mm bore',
  materialType: 'Spare Part',
  status: 'Active',
  plantId: 1,
  manufacturerId: 1,
  manufacturerPartNumber: '6205-2RS',
  unitOfMeasure: 'EA',
  unitPrice: '10.00',
  quantityOnHand: 5,
} as const;

// These tests change data, so the fixtures are reloaded after each one. The other
// test files rely on the rows being exactly as fixtures.ts describes them.
afterEach(() => resetDatabase(db));

describe('materials.byId', () => {
  it('returns the material with its plant and manufacturer', async () => {
    expect(await caller.materials.byId({ id: 1 })).toMatchObject({
      materialNumber: 'MAT-000001',
      unitPrice: '10.00',
      plant: { code: '1000', name: 'Brisbane' },
      manufacturer: { name: 'SKF' },
    });
  });

  it('reports NOT_FOUND for an id that does not exist', async () => {
    await expect(caller.materials.byId({ id: 999 })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('materials.update', () => {
  it('saves the changes and returns the material as it now stands', async () => {
    const saved = await caller.materials.update({
      ...ROW_ONE,
      description: '  Bearing, sealed, 25mm bore  ',
      status: 'Obsolete',
      plantId: 2,
      unitPrice: '12.5',
      quantityOnHand: 0,
    });

    expect(saved).toMatchObject({
      materialNumber: 'MAT-000001',
      description: 'Bearing, sealed, 25mm bore',
      status: 'Obsolete',
      plant: { name: 'Sydney' },
      unitPrice: '12.50',
      quantityOnHand: 0,
    });
    // Reading it again proves the change was stored, not just echoed back.
    expect(await caller.materials.byId({ id: 1 })).toEqual(saved);
  });

  it('moves the "last updated" time forward', async () => {
    const before = await caller.materials.byId({ id: 1 });
    const saved = await caller.materials.update({ ...ROW_ONE, quantityOnHand: 6 });

    expect(saved.updatedAt.getTime()).toBeGreaterThan(before.updatedAt.getTime());
    expect(saved.createdAt).toEqual(before.createdAt);
  });

  it('clears the manufacturer and stores an empty part number as null', async () => {
    const saved = await caller.materials.update({
      ...ROW_ONE,
      manufacturerId: null,
      manufacturerPartNumber: '   ',
    });

    expect(saved.manufacturer).toBeNull();
    expect(saved.manufacturerPartNumber).toBeNull();
  });

  it.each([
    ['an empty description', { description: '   ' }],
    ['a negative price', { unitPrice: '-1' }],
    ['a price with three decimal places', { unitPrice: '1.005' }],
    ['a price that is not a number', { unitPrice: 'abc' }],
    ['a negative quantity', { quantityOnHand: -1 }],
    ['a fractional quantity', { quantityOnHand: 1.5 }],
    ['an unknown status', { status: 'Deleted' }],
  ])('rejects %s and changes nothing', async (_name, change) => {
    const before = await caller.materials.byId({ id: 1 });
    const invalidInput = { ...ROW_ONE, ...change } as never;

    await expect(caller.materials.update(invalidInput)).rejects.toMatchObject({
      code: 'BAD_REQUEST',
    });
    expect(await caller.materials.byId({ id: 1 })).toEqual(before);
  });

  it('rejects a plant that does not exist', async () => {
    await expect(caller.materials.update({ ...ROW_ONE, plantId: 999 })).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'The selected plant or manufacturer no longer exists.',
    });
  });

  it('reports NOT_FOUND for an id that does not exist', async () => {
    await expect(caller.materials.update({ ...ROW_ONE, id: 999 })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});
