import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globalSetup: ['tests/global-setup.ts'],
    // The database tests share one database and wipe its tables: they must not run at the same time.
    fileParallelism: process.env.RUN_DB_TESTS !== 'true',
  },
});
