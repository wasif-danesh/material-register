import { listMaterialsInputSchema } from '@material-register/shared';
import { listMaterials } from './materials/listMaterials.ts';
import { listOptions } from './materials/listOptions.ts';
import { publicProcedure, router } from './trpc.ts';

// The procedures stay thin: validate the input, call one function, return its result.
// The query logic lives in its own files so tests can call it without HTTP.
export const appRouter = router({
  materials: router({
    list: publicProcedure
      .input(listMaterialsInputSchema)
      .query(({ input }) => listMaterials(input)),
  }),
  meta: router({
    options: publicProcedure.query(() => listOptions()),
  }),
});

/** The web app imports only this type, never the server code. */
export type AppRouter = typeof appRouter;
