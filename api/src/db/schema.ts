import { MATERIAL_STATUSES, MATERIAL_TYPES, UNITS_OF_MEASURE } from '@material-register/shared';
import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const materialTypeEnum = pgEnum('material_type', MATERIAL_TYPES);
export const materialStatusEnum = pgEnum('material_status', MATERIAL_STATUSES);
export const unitOfMeasureEnum = pgEnum('unit_of_measure', UNITS_OF_MEASURE);

export const plants = pgTable('plants', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
});

export const manufacturers = pgTable('manufacturers', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull().unique(),
});

export const materials = pgTable(
  'materials',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    materialNumber: text('material_number').notNull().unique(),
    description: text('description').notNull(),
    materialType: materialTypeEnum('material_type').notNull(),
    status: materialStatusEnum('status').notNull(),
    // One plant per material, as the brief suggests. SAP keeps stock per plant in a
    // linking table; that is noted in the README as a known simplification.
    plantId: integer('plant_id')
      .notNull()
      .references(() => plants.id, { onDelete: 'restrict' }),
    // Optional: raw materials such as steel plate often have no manufacturer.
    manufacturerId: integer('manufacturer_id').references(() => manufacturers.id, {
      onDelete: 'restrict',
    }),
    manufacturerPartNumber: text('manufacturer_part_number'),
    unitOfMeasure: unitOfMeasureEnum('unit_of_measure').notNull(),
    // numeric, not a float, so money is stored exactly. Drizzle returns it as a string.
    unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
    quantityOnHand: integer('quantity_on_hand').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // Postgres indexes primary keys and unique columns itself, but not foreign keys.
    index('materials_plant_id_idx').on(table.plantId),
    index('materials_manufacturer_id_idx').on(table.manufacturerId),
    index('materials_status_idx').on(table.status),
    index('materials_material_type_idx').on(table.materialType),
    // Serves the default sort (newest first, id as the tie-break). A plain ascending
    // index is enough: Postgres reads it backwards for ORDER BY ... DESC, ... DESC.
    index('materials_updated_at_id_idx').on(table.updatedAt, table.id),
    // Trigram indexes for the search box. The search is a "contains" match
    // (ILIKE '%text%') on these three columns, which an ordinary index cannot serve
    // because the text may start anywhere. A trigram index stores every three-character
    // piece of each value, so Postgres can find the rows containing the pieces of the
    // search text. The query itself is unchanged. Searches shorter than three
    // characters cannot use them. Measured in docs/search-performance.md.
    index('materials_material_number_trgm_idx').using(
      'gin',
      table.materialNumber.op('gin_trgm_ops'),
    ),
    index('materials_description_trgm_idx').using('gin', table.description.op('gin_trgm_ops')),
    index('materials_manufacturer_part_number_trgm_idx').using(
      'gin',
      table.manufacturerPartNumber.op('gin_trgm_ops'),
    ),
    // Last line of defence if a bug gets past the API validation.
    check('materials_unit_price_check', sql`${table.unitPrice} >= 0`),
    check('materials_quantity_on_hand_check', sql`${table.quantityOnHand} >= 0`),
  ],
);
