import type { UpdateMaterialInput } from '@material-register/shared';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { db } from '../db/client.ts';
import { materials } from '../db/schema.ts';
import { getMaterial } from './getMaterial.ts';

// Postgres's error code for "this foreign key points at a row that does not exist".
const FOREIGN_KEY_VIOLATION = '23503';

/** Drizzle wraps the database's error; the Postgres error code is on its `cause`. */
function isForeignKeyViolation(error: unknown): boolean {
  const cause = (error as { cause?: { code?: unknown } } | null)?.cause;
  return cause?.code === FOREIGN_KEY_VIOLATION;
}

/**
 * Saves the editable fields of one material and returns it as it now stands, or
 * undefined when no material has this id. `updated_at` is set by the schema.
 */
export async function updateMaterial({ id, ...changes }: UpdateMaterialInput) {
  try {
    const updated = await db
      .update(materials)
      .set(changes)
      .where(eq(materials.id, id))
      .returning({ id: materials.id });

    if (updated.length === 0) {
      return undefined;
    }
  } catch (error) {
    // The ids were valid numbers, but the plant or manufacturer does not exist (for
    // example, it was removed after the form was opened). The foreign key catches it;
    // checking first with a separate query would leave a gap between check and write.
    if (isForeignKeyViolation(error)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'The selected plant or manufacturer no longer exists.',
      });
    }
    throw error;
  }

  // Read it back with its plant and manufacturer, in the same shape as everywhere else.
  return getMaterial(id);
}
