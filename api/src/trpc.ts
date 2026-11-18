import { initTRPC } from '@trpc/server';
import { z, ZodError } from 'zod';

const t = initTRPC.create({
  // Never send stack traces to the browser, in any environment.
  isDev: false,
  errorFormatter({ shape, error }) {
    const validationError = error.cause instanceof ZodError ? error.cause : null;

    let message = shape.message;
    if (validationError) {
      message = 'Invalid input.';
    } else if (error.code === 'INTERNAL_SERVER_ERROR') {
      // Unexpected errors can carry SQL or connection details. The real error is
      // logged on the server (see app.ts); the browser only gets a generic message.
      message = 'Something went wrong. Please try again.';
    }

    return {
      ...shape,
      message,
      data: {
        ...shape.data,
        // Per-field messages, so a form can show each one beside its input.
        fieldErrors: validationError ? z.flattenError(validationError).fieldErrors : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
