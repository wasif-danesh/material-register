import { createApp } from './app.ts';
import { pool } from './db/client.ts';
import { env } from './env.ts';

const server = createApp().listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});

// Hosting platforms send SIGTERM before replacing a running version. Finish the
// requests in progress, then close the database connections and exit.
function shutDown() {
  server.close(() => {
    void pool.end().then(() => process.exit(0));
  });
}

process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);
