import { defineConfig } from 'vitest/config';
import { TEST_DATABASE_URL } from './test/testDatabase.ts';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    // Creates the test database, applies the migrations and loads the fixtures, once.
    globalSetup: './test/globalSetup.ts',
    // Closes each test file's connection pool so the run can finish.
    setupFiles: './test/closePool.ts',
    // The application reads DATABASE_URL. Setting it here, before any application code
    // loads, is what sends every query in a test to the test database.
    env: { DATABASE_URL: TEST_DATABASE_URL },
  },
});
