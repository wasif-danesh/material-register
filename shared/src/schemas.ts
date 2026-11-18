import { z } from 'zod';
import { MATERIAL_STATUSES, MATERIAL_TYPES } from './constants.ts';

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
