// The fixed value sets, defined once. The database enums, the API validation and the
// front-end dropdowns all read these lists, so adding a value is a change in one place
// (plus a migration, because the database enum has to learn the new value).

export const MATERIAL_TYPES = ['Spare Part', 'Consumable', 'Raw Material', 'Tool'] as const;
export type MaterialType = (typeof MATERIAL_TYPES)[number];

export const MATERIAL_STATUSES = ['Active', 'Obsolete', 'Pending Review'] as const;
export type MaterialStatus = (typeof MATERIAL_STATUSES)[number];

export const UNITS_OF_MEASURE = ['EA', 'KG', 'L', 'M', 'BOX', 'SET'] as const;
export type UnitOfMeasure = (typeof UNITS_OF_MEASURE)[number];
