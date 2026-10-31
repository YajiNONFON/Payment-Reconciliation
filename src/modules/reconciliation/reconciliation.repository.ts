import { getPrisma } from '../../lib/prisma';
import type { InvoiceRecord, PaymentRecord } from './reconciliation.dto';

export async function findInvoices(): Promise<InvoiceRecord[]> {
  return getPrisma().invoice.findMany({
    select: { reference: true, amountCents: true },
    orderBy: { id: 'asc' },
  });
}

export async function findPayments(): Promise<PaymentRecord[]> {
  return getPrisma().payment.findMany({
    select: { reference: true, amountCents: true },
    orderBy: { id: 'asc' },
  });
}
