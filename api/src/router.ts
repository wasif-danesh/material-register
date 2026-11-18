import {
  listMaterialsInputSchema,
  materialIdSchema,
  updateMaterialInputSchema,
} from '@material-register/shared';
import { TRPCError } from '@trpc/server';
import { getMaterial } from './materials/getMaterial.ts';
import { listMaterials } from './materials/listMaterials.ts';
import { listOptions } from './materials/listOptions.ts';
import { updateMaterial } from './materials/updateMaterial.ts';
import { publicProcedure, router } from './trpc.ts';

/** Turns "no such material" into a 404 for the caller. */
function foundOrThrow<T>(material: T | undefined): T {
  if (!material) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Material not found.' });
  }
  return material;
}

// The procedures stay thin: validate the input, call one function, return its result.
// The query logic lives in its own files so tests can call it without HTTP.
export const appRouter = router({
  materials: router({
    list: publicProcedure
      .input(listMaterialsInputSchema)
      .query(({ input }) => listMaterials(input)),
    byId: publicProcedure
      .input(materialIdSchema)
      .query(async ({ input }) => foundOrThrow(await getMaterial(input.id))),
    update: publicProcedure
      .input(updateMaterialInputSchema)
      .mutation(async ({ input }) => foundOrThrow(await updateMaterial(input))),
  }),
  meta: router({
    options: publicProcedure.query(() => listOptions()),
  }),
});

/** The web app imports only this type, never the server code. */
export type AppRouter = typeof appRouter;
