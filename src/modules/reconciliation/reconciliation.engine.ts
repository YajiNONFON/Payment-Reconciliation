import type {
  Category,
  InvoiceRecord,
  PaymentRecord,
  Reconciliation,
  ReportItem,
} from './reconciliation.dto';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const money = (cents: number): string => usd.format(cents / 100);

/**
 * Matches payments to invoices. Pure function: no database, no clock, no randomness,
 * so the same input always gives the same report.
 *
 * A payment matches an invoice only when the reference is identical AND the amount is
 * identical, to the cent. There is no fuzzy matching: a mistyped reference is reported,
 * never guessed. One mistake can therefore produce two findings (an unpaid invoice and
 * a payment that matches nothing), which is what the person doing the books needs to see.
 *
 * Partial payments are not combined: two payments of 50 do not settle an invoice of 100.
 */
export function reconcile(invoices: InvoiceRecord[], payments: PaymentRecord[]): Reconciliation {
  const invoiceByReference = new Map(invoices.map((invoice) => [invoice.reference, invoice]));

  const paymentsByReference = new Map<string, PaymentRecord[]>();
  for (const payment of payments) {
    const group = paymentsByReference.get(payment.reference);
    if (group) group.push(payment);
    else paymentsByReference.set(payment.reference, [payment]);
  }

  const items: ReportItem[] = [];

  // 1. Every invoice ends up ok, missing or duplicate.
  for (const invoice of invoices) {
    const sameReference = paymentsByReference.get(invoice.reference) ?? [];
    const exact = sameReference.filter((payment) => payment.amountCents === invoice.amountCents);

    if (exact.length === 1) {
      items.push({
        category: 'ok',
        reference: invoice.reference,
        expectedCents: invoice.amountCents,
        receivedCents: invoice.amountCents,
        paymentCount: 1,
        note: '',
      });
    } else if (exact.length === 0) {
      const wrongAmounts = sameReference.map((payment) => money(payment.amountCents));
      items.push({
        category: 'missing',
        reference: invoice.reference,
        expectedCents: invoice.amountCents,
        receivedCents: 0,
        paymentCount: sameReference.length,
        note:
          wrongAmounts.length === 0
            ? 'No payment received.'
            : `Not paid in full. Payments with this reference have a different amount: ${wrongAmounts.join(', ')}.`,
      });
    } else {
      const refund = (exact.length - 1) * invoice.amountCents;
      items.push({
        category: 'duplicate',
        reference: invoice.reference,
        expectedCents: invoice.amountCents,
        receivedCents: exact.length * invoice.amountCents,
        paymentCount: exact.length,
        note: `Paid ${exact.length} times. Refund due: ${money(refund)}.`,
      });
    }
  }

  // 2. Every payment that did not settle its invoice is unmatched.
  for (const payment of payments) {
    const invoice = invoiceByReference.get(payment.reference);
    if (invoice && invoice.amountCents === payment.amountCents) continue;

    items.push({
      category: 'unmatched',
      reference: payment.reference,
      expectedCents: invoice ? invoice.amountCents : null,
      receivedCents: payment.amountCents,
      paymentCount: 1,
      note: invoice
        ? `The invoice is for ${money(invoice.amountCents)} but this payment is ${money(payment.amountCents)}.`
        : 'No invoice has this reference.',
    });
  }

  const count = (category: Category): number =>
    items.filter((item) => item.category === category).length;

  return {
    totals: {
      invoices: invoices.length,
      payments: payments.length,
      ok: count('ok'),
      missing: count('missing'),
      duplicate: count('duplicate'),
      unmatched: count('unmatched'),
    },
    items,
  };
}
