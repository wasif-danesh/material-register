import { faker } from '@faker-js/faker';
import type { MaterialStatus, MaterialType, UnitOfMeasure } from '@material-register/shared';
import { PART_FAMILIES, PLANTS, type PartFamily } from './catalogue.ts';

/** A material before it is written: it names its plant and maker instead of using ids. */
export type SeedMaterial = {
  materialNumber: string;
  description: string;
  materialType: MaterialType;
  status: MaterialStatus;
  plantCode: string;
  manufacturerName: string | null;
  manufacturerPartNumber: string | null;
  unitOfMeasure: UnitOfMeasure;
  unitPrice: string;
  quantityOnHand: number;
  createdAt: Date;
  updatedAt: Date;
};

// Fixed dates, not "now", so every run produces exactly the same rows.
const HISTORY_START = new Date('2023-11-01T00:00:00Z');
const HISTORY_END = new Date('2026-11-01T00:00:00Z');
// Obsolete parts were last touched a while ago.
const OBSOLETE_BEFORE = new Date('2025-06-01T00:00:00Z');

const STATUS_CHOICES: { value: MaterialStatus; weight: number }[] = [
  { value: 'Active', weight: 80 },
  { value: 'Obsolete', weight: 12 },
  { value: 'Pending Review', weight: 8 },
];
const FAMILY_CHOICES = PART_FAMILIES.map((family) => ({ value: family, weight: family.weight }));
const PLANT_CHOICES = PLANTS.map((plant) => ({ value: plant.code, weight: plant.weight }));

/** Replaces each `{name}` in the template with the value picked for that name. */
function fillPlaceholders(template: string, picked: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, name: string) => picked[name] ?? '');
}

function buildMaterial(index: number, family: PartFamily): SeedMaterial {
  // Pick one value per option first, so the description and part number agree.
  const picked: Record<string, string> = {};
  for (const [name, values] of Object.entries(family.options)) {
    picked[name] = faker.helpers.arrayElement(values);
  }

  const status = faker.helpers.weightedArrayElement(STATUS_CHOICES);
  const updatedAt = faker.date.between({
    from: HISTORY_START,
    to: status === 'Obsolete' ? OBSOLETE_BEFORE : HISTORY_END,
  });

  // Squaring a 0-to-1 random number pushes most prices towards the low end of the
  // family's range, which is how a real catalogue looks: many cheap sizes, few dear ones.
  const [minPrice, maxPrice] = family.price;
  const unitPrice = minPrice + (maxPrice - minPrice) * faker.number.float() ** 2;

  // About one material in seven is out of stock; the rest hold at least one.
  const [minStock, maxStock] = family.stock;
  const quantityOnHand = faker.datatype.boolean(0.15)
    ? 0
    : faker.number.int({ min: Math.max(1, minStock), max: maxStock });

  const hasMaker = family.makers.length > 0;

  return {
    materialNumber: `MAT-${String(index + 1).padStart(6, '0')}`,
    description: fillPlaceholders(family.description, picked),
    materialType: family.type,
    status,
    plantCode: faker.helpers.weightedArrayElement(PLANT_CHOICES),
    manufacturerName: hasMaker ? faker.helpers.arrayElement(family.makers) : null,
    manufacturerPartNumber: family.partNumber
      ? faker.helpers.replaceSymbols(fillPlaceholders(family.partNumber, picked))
      : null,
    unitOfMeasure: family.unit,
    unitPrice: unitPrice.toFixed(2),
    quantityOnHand,
    createdAt: faker.date.between({ from: HISTORY_START, to: updatedAt }),
    updatedAt,
  };
}

/**
 * Builds `count` materials. The random generator starts from a fixed seed, so the same
 * count always gives the same rows; tests, demo searches and shared links stay valid.
 */
export function generateMaterials(count: number): SeedMaterial[] {
  faker.seed(42);
  return Array.from({ length: count }, (_, index) =>
    buildMaterial(index, faker.helpers.weightedArrayElement(FAMILY_CHOICES)),
  );
}
