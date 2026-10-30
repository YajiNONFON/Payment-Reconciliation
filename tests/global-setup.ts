import 'dotenv/config';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

/**
 * Only does something when RUN_DB_TESTS=true: points the tests at the *_test
 * database (never the development one) and applies the migrations to it.
 */
function fail(message: string): never {
  // Printed first: the test runner can hide the message of an error thrown here.
  console.error(`\n[test setup] ${message}\n`);
  throw new Error(message);
}

export default function setup(): void {
  if (process.env.RUN_DB_TESTS !== 'true') return;

  const url = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'RUN_DB_TESTS=true needs TEST_DATABASE_URL (or DATABASE_URL). See .env.example.',
    );
  }

  const databaseName = new URL(url).pathname.replace(/^\//, '');
  if (!databaseName.endsWith('_test')) {
    fail(
      `Refusing to run DB tests on "${databaseName}": the tests wipe the tables, so the database name must end with "_test".`,
    );
  }

  process.env.DATABASE_URL = url;

  const prismaCli = path.join(process.cwd(), 'node_modules', 'prisma', 'build', 'index.js');
  execFileSync(process.execPath, [prismaCli, 'migrate', 'deploy'], {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: url },
  });
}
