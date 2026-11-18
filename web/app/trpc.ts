// A type-only import: the web app gets the API's input and output types, but none of
// the server code ends up in the browser bundle.
import type { AppRouter } from '@material-register/api';
import { createTRPCContext } from '@trpc/tanstack-react-query';
import type { inferRouterOutputs } from '@trpc/server';

export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/trpc';

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

type Outputs = inferRouterOutputs<AppRouter>;
export type MaterialRow = Outputs['materials']['list']['items'][number];
export type FilterOptions = Outputs['meta']['options'];
