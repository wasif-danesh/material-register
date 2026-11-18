import type { RequestHandler } from 'express';

/** Writes one JSON line per request once the response has been sent. */
export const requestLogger: RequestHandler = (req, res, next) => {
  const startedAt = performance.now();

  res.on('finish', () => {
    console.log(
      JSON.stringify({
        time: new Date().toISOString(),
        method: req.method,
        // The path only: tRPC puts query input in the query string, which is long.
        // originalUrl, because Express shortens req.path inside a mounted router.
        path: req.originalUrl.split('?')[0],
        status: res.statusCode,
        durationMs: Math.round(performance.now() - startedAt),
      }),
    );
  });

  next();
};
