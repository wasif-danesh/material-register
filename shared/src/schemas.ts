import { z } from 'zod';
import { MATERIAL_STATUSES, MATERIAL_TYPES, UNITS_OF_MEASURE } from './constants.ts';

// These schemas are the contract between the web app and the API. The API validates
// every request with them, and the web app uses the same ones to read the URL, so the
// two sides cannot drift apart.

/** The columns the table may be sorted by. Anything else is rejected by validation. */
export const SORT_FIELDS = [
  'materialNumber',
  'description',
  'unitPrice',
  'quantityOnHand',
  'updatedAt',
] as const;
export type SortField = (typeof SORT_FIELDS)[number];

export const SORT_DIRECTIONS = ['asc', 'desc'] as const;
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export const PAGE_SIZES = [10, 25, 50, 100] as const;

// The cap stops a request from sending an unbounded list of ids.
const idListSchema = z.array(z.number().int().positive()).max(100).default([]);

export const listMaterialsInputSchema = z.object({
  search: z.string().trim().max(100).default(''),
  types: z.array(z.enum(MATERIAL_TYPES)).default([]),
  statuses: z.array(z.enum(MATERIAL_STATUSES)).default([]),
  plantIds: idListSchema,
  manufacturerIds: idListSchema,
  sortBy: z.enum(SORT_FIELDS).default('updatedAt'),
  sortDir: z.enum(SORT_DIRECTIONS).default('desc'),
  page: z.number().int().min(1).max(100_000).default(1),
  // A fixed set of sizes, so nobody can ask for a million rows in one page.
  pageSize: z.literal([...PAGE_SIZES]).default(25),
});

/** The input after validation, with every default filled in. */
export type ListMaterialsInput = z.infer<typeof listMaterialsInputSchema>;

export const materialIdSchema = z.object({ id: z.number().int().positive() });

/**
 * The editable fields of a material. The edit form validates with this schema in the
 * browser and the API validates with it again, so both give the same messages. The
 * material number is not here: it identifies the material and cannot be changed.
 */
export const materialFieldsSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, 'Enter a description')
    .max(200, 'Use 200 characters or fewer'),
  materialType: z.enum(MATERIAL_TYPES, 'Choose a type'),
  status: z.enum(MATERIAL_STATUSES, 'Choose a status'),
  plantId: z.number('Choose a plant').int().positive(),
  manufacturerId: z.number().int().positive().nullable(),
  // An empty box means "no part number" and is stored as null, not as an empty string.
  manufacturerPartNumber: z
    .string()
    .trim()
    .max(60, 'Use 60 characters or fewer')
    .nullable()
    .transform((value) => value || null),
  unitOfMeasure: z.enum(UNITS_OF_MEASURE, 'Choose a unit'),
  // Money stays a decimal string from the form to the database and is never a float.
  // The pattern matches the column: up to 10 digits, then at most 2 decimal places.
  unitPrice: z
    .string()
    .trim()
    .regex(/^\d{1,10}(\.\d{1,2})?$/, 'Enter a price such as 12.50'),
  quantityOnHand: z
    .number('Enter a whole number')
    .int('Enter a whole number')
    .min(0, 'Enter zero or more')
    // The largest value the integer column can hold.
    .max(2_147_483_647, 'That number is too large'),
});

/** What the form holds while editing (before trimming and the empty-to-null change). */
export type MaterialFormValues = z.input<typeof materialFieldsSchema>;

export const updateMaterialInputSchema = materialFieldsSchema.extend(materialIdSchema.shape);
export type UpdateMaterialInput = z.infer<typeof updateMaterialInputSchema>;
