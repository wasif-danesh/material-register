import { createExpressMiddleware } from '@trpc/server/adapters/express';
import cors from 'cors';
import { sql } from 'drizzle-orm';
import express from 'express';
import helmet from 'helmet';
import { db } from './db/client.ts';
import { env } from './env.ts';
import { requestLogger } from './http/requestLogger.ts';
import { appRouter } from './router.ts';

/** Builds the Express app without starting it, so tests can use it too. */
export function createApp() {
  const app = express();

  app.use(helmet());
  // Only the web app's own address may call the API from a browser.
  app.use(cors({ origin: env.WEB_ORIGIN }));
  app.use(requestLogger);

  // Used by the hosting platform. It runs a real query, so it also reports a lost
  // database connection, not just that the process is alive.
  app.get('/health', async (_req, res) => {
    try {
      await db.execute(sql`select 1`);
      res.json({ status: 'ok' });
    } catch {
      res.status(503).json({ status: 'unavailable' });
    }
  });

  app.use(
    '/trpc',
    createExpressMiddleware({
      router: appRouter,
      onError({ error, path }) {
        // Bad input and not-found are the caller's mistakes and need no log entry.
        if (error.code === 'INTERNAL_SERVER_ERROR') {
          console.error(`Unexpected error in ${path ?? 'unknown procedure'}:`, error);
        }
      },
    }),
  );

  return app;
}
