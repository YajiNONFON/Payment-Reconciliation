import { readFileSync } from 'node:fs';
import path from 'node:path';
import { disconnectPrisma, getPrisma } from '../src/lib/prisma';
import * as invoiceService from '../src/modules/invoices/invoice.service';
import * as paymentService from '../src/modules/payments/payment.service';

// The demo files are the same ones the tests use, so the demo and the tests cannot drift apart.
const demoFile = (name: string): string =>
  readFileSync(path.join(__dirname, '..', 'tests', 'fixtures', name), 'utf8');

/**
 * Loads the demo files: 28 invoices and 30 payments with hidden anomalies.
 * Refuses to run on a database that already has data, unless `reset` is true,
 * in which case every invoice and payment is deleted first.
 */
export async function seedDemo(options: {
  reset: boolean;
}): Promise<{ invoices: number; payments: number }> {
  const prisma = getPrisma();
  const existing = (await prisma.invoice.count()) + (await prisma.payment.count());

  if (existing > 0) {
    if (!options.reset) {
      throw new Error(
        'The database already contains data. Run "npm run seed:reset" to replace it with the demo files.',
      );
    }
    await prisma.payment.deleteMany();
    await prisma.invoice.deleteMany();
  }

  const invoices = await invoiceService.importFromCsv(demoFile('demo-invoices.csv'));
  const payments = await paymentService.importFromCsv(demoFile('demo-payments.csv'));
  return { invoices: invoices.imported, payments: payments.imported };
}

async function main(): Promise<void> {
  const reset = process.argv.includes('--reset');
  try {
    const result = await seedDemo({ reset });
    console.log(`Seeded ${result.invoices} invoices and ${result.payments} payments.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await disconnectPrisma();
  }
}

if (require.main === module) {
  void main();
}
