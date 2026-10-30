import { toDateOnly } from '../../lib/dates';
import { getPrisma } from '../../lib/prisma';
import type { InvoiceInput } from './invoice.dto';

export async function createMany(items: InvoiceInput[]) {
  // A single INSERT statement: either every row is saved or none is.
  return getPrisma().invoice.createMany({
    data: items.map((item) => ({
      reference: item.reference,
      customer: item.customer,
      amountCents: item.amountCents,
      issueDate: toDateOnly(item.issueDate),
    })),
  });
}

export async function findExistingReferences(references: string[]): Promise<string[]> {
  const rows = await getPrisma().invoice.findMany({
    where: { reference: { in: references } },
    select: { reference: true },
  });
  return rows.map((row) => row.reference);
}

export async function findAll() {
  return getPrisma().invoice.findMany({ orderBy: { id: 'asc' } });
}
