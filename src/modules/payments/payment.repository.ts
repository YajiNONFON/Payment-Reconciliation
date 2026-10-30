import { toDateOnly } from '../../lib/dates';
import { getPrisma } from '../../lib/prisma';
import type { PaymentInput } from './payment.dto';

export async function createMany(items: PaymentInput[]) {
  // A single INSERT statement: either every row is saved or none is.
  return getPrisma().payment.createMany({
    data: items.map((item) => ({
      reference: item.reference,
      payer: item.payer,
      amountCents: item.amountCents,
      paidDate: toDateOnly(item.paidDate),
    })),
  });
}

export async function findAll() {
  return getPrisma().payment.findMany({ orderBy: { id: 'asc' } });
}
