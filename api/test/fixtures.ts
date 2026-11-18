import type { materials } from '../src/db/schema.ts';

// A small, hand-written data set. Unlike the 10,000 seeded rows, every row here exists
// to make one behaviour testable, so an expected result can be checked by reading this file.

export const PLANTS = [
  { code: '1000', name: 'Brisbane' }, // id 1
  { code: '2000', name: 'Sydney' }, // id 2
];

export const MANUFACTURERS = [
  { name: 'SKF' }, // id 1
  { name: 'Gates' }, // id 2
];

type NewMaterial = typeof materials.$inferInsert;

/** Fills in the columns a test does not care about. */
function material(
  number: number,
  overrides: Partial<NewMaterial> & Pick<NewMaterial, 'description'>,
): NewMaterial {
  return {
    materialNumber: `MAT-${String(number).padStart(6, '0')}`,
    materialType: 'Spare Part',
    status: 'Active',
    plantId: 1,
    manufacturerId: 1,
    manufacturerPartNumber: `PN-${number}`,
    unitOfMeasure: 'EA',
    unitPrice: '10.00',
    quantityOnHand: 5,
    // One day apart, so "newest first" has a single correct order: 12, 11, ... 1.
    createdAt: new Date(Date.UTC(2026, 0, number)),
    updatedAt: new Date(Date.UTC(2026, 0, number)),
    ...overrides,
  };
}

// Ids are assigned in this order, 1 to 12.
export const MATERIALS: NewMaterial[] = [
  material(1, {
    description: 'Bearing, deep groove ball, 25mm bore',
    manufacturerPartNumber: '6205-2RS',
  }),
  material(2, {
    description: 'Bearing, tapered roller, 30mm bore',
    status: 'Obsolete',
    plantId: 2,
  }),
  material(3, {
    description: 'V-belt, SPB section, 2000mm',
    manufacturerId: 2,
    manufacturerPartNumber: 'SPB2000-1',
  }),
  // "belt" appears only in this row's part number, not its description.
  material(4, {
    description: 'Drive band, flat',
    manufacturerId: 2,
    manufacturerPartNumber: 'BELT-77',
  }),
  // Raw material: no manufacturer and no part number.
  material(5, {
    description: 'Plate, steel, grade 250, 10mm',
    materialType: 'Raw Material',
    manufacturerId: null,
    manufacturerPartNumber: null,
    unitOfMeasure: 'KG',
  }),
  // These two contain the LIKE wildcards as ordinary characters.
  material(6, { description: 'Coolant, 50% glycol', materialType: 'Consumable' }),
  material(7, {
    description: 'Seal kit, type A_B',
    materialType: 'Consumable',
    status: 'Pending Review',
  }),
  material(8, { description: 'Wrench, torque, 1/2 inch drive', materialType: 'Tool', plantId: 2 }),
  // Different prices and stock, for sorting. Every other row costs 10.00, so sorting
  // by price leaves ten rows tied; the tests check that paging still shows each once.
  material(9, { description: 'Motor, electric, 15kW', unitPrice: '2500.00', quantityOnHand: 0 }),
  material(10, { description: 'O-ring, nitrile, 30mm', unitPrice: '0.50', quantityOnHand: 400 }),
  material(11, { description: 'Filter element, hydraulic, 10 micron', status: 'Obsolete' }),
  material(12, {
    description: 'Grease, lithium complex, 450g cartridge',
    materialType: 'Consumable',
    plantId: 2,
  }),
];
