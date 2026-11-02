import { disconnectPrisma } from '../src/lib/prisma';
import type { Category } from '../src/modules/reconciliation/reconciliation.dto';
import * as reconciliationService from '../src/modules/reconciliation/reconciliation.service';
import { seedDemo } from './seed';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const money = (cents: number): string => usd.format(cents / 100);

const TITLES: Record<Exclude<Category, 'ok'>, string> = {
  missing: 'Not paid',
  duplicate: 'Paid twice',
  unmatched: 'No matching invoice',
};

/** Resets the database to the demo files, then prints the anomaly report. */
async function main(): Promise<void> {
  try {
    console.log('Replacing the data in the database with the demo files...');
    const loaded = await seedDemo({ reset: true });
    console.log(`Loaded ${loaded.invoices} invoices and ${loaded.payments} payments.\n`);

    const { totals, items } = await reconciliationService.report();
    const attention = totals.missing + totals.duplicate + totals.unmatched;
    console.log(`${attention} items need a second look. ${totals.ok} invoices are fine.\n`);

    for (const category of ['missing', 'duplicate', 'unmatched'] as const) {
      const group = items.filter((item) => item.category === category);
      console.log(`${TITLES[category]} (${group.length})`);
      for (const item of group) {
        const billed = item.expectedCents === null ? '-' : money(item.expectedCents);
        console.log(
          `  ${item.reference.padEnd(9)} billed ${billed.padStart(10)}  received ${money(item.receivedCents).padStart(10)}  ${item.note}`,
        );
      }
      console.log('');
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await disconnectPrisma();
  }
}

void main();
