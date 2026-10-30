import { getPrisma } from '../../src/lib/prisma';

export const dbTestsEnabled = process.env.RUN_DB_TESTS === 'true';

/** Empties both tables. Refuses to run unless the database name ends with "_test". */
export async function resetDatabase(): Promise<void> {
  const databaseName = new URL(process.env.DATABASE_URL ?? 'postgresql://x/none').pathname.slice(1);
  if (!databaseName.endsWith('_test')) {
    throw new Error(`Refusing to wipe "${databaseName}": not a *_test database.`);
  }
  const prisma = getPrisma();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
}
