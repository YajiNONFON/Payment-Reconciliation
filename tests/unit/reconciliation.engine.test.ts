import { describe, expect, it } from 'vitest';
import { reconcile } from '../../src/modules/reconciliation/reconciliation.engine';

const invoice = (reference: string, amountCents: number) => ({ reference, amountCents });
const payment = (reference: string, amountCents: number) => ({ reference, amountCents });

describe('reconcile', () => {
  it('marks an invoice paid once, for the right amount, as ok', () => {
    const { items, totals } = reconcile([invoice('INV-1', 10000)], [payment('INV-1', 10000)]);

    expect(items).toEqual([
      {
        category: 'ok',
        reference: 'INV-1',
        expectedCents: 10000,
        receivedCents: 10000,
        paymentCount: 1,
        note: '',
      },
    ]);
    expect(totals).toEqual({
      invoices: 1,
      payments: 1,
      ok: 1,
      missing: 0,
      duplicate: 0,
      unmatched: 0,
    });
  });

  it('marks an invoice with no payment as missing', () => {
    const { items } = reconcile([invoice('INV-1', 10000)], []);

    expect(items).toEqual([
      expect.objectContaining({
        category: 'missing',
        reference: 'INV-1',
        receivedCents: 0,
        paymentCount: 0,
        note: 'No payment received.',
      }),
    ]);
  });

  it('marks the same reference paid twice as a duplicate and states the refund', () => {
    const { items } = reconcile(
      [invoice('INV-1', 19900)],
      [payment('INV-1', 19900), payment('INV-1', 19900)],
    );

    expect(items).toEqual([
      expect.objectContaining({
        category: 'duplicate',
        expectedCents: 19900,
        receivedCents: 39800,
        paymentCount: 2,
        note: 'Paid 2 times. Refund due: $199.00.',
      }),
    ]);
  });

  it('counts three payments as one duplicate with two refunds due', () => {
    const { items, totals } = reconcile(
      [invoice('INV-1', 5000)],
      [payment('INV-1', 5000), payment('INV-1', 5000), payment('INV-1', 5000)],
    );

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      category: 'duplicate',
      paymentCount: 3,
      note: 'Paid 3 times. Refund due: $100.00.',
    });
    expect(totals.duplicate).toBe(1);
  });

  it('reports a wrong amount twice: an unpaid invoice and a payment that matches nothing', () => {
    const { items } = reconcile([invoice('INV-1', 54000)], [payment('INV-1', 45000)]);

    expect(items).toEqual([
      expect.objectContaining({
        category: 'missing',
        reference: 'INV-1',
        paymentCount: 1,
        note: 'Not paid in full. Payments with this reference have a different amount: $450.00.',
      }),
      expect.objectContaining({
        category: 'unmatched',
        reference: 'INV-1',
        expectedCents: 54000,
        receivedCents: 45000,
        note: 'The invoice is for $540.00 but this payment is $450.00.',
      }),
    ]);
  });

  it('marks a payment with an unknown reference as unmatched, without an expected amount', () => {
    const { items } = reconcile([], [payment('INV-99', 15000)]);

    expect(items).toEqual([
      {
        category: 'unmatched',
        reference: 'INV-99',
        expectedCents: null,
        receivedCents: 15000,
        paymentCount: 1,
        note: 'No invoice has this reference.',
      },
    ]);
  });

  it('never guesses: a reference off by one character is not matched', () => {
    // "INV-1O18" has the letter O where the invoice has the digit 0.
    const { items, totals } = reconcile([invoice('INV-1018', 52000)], [payment('INV-1O18', 52000)]);

    expect(totals).toMatchObject({ ok: 0, missing: 1, unmatched: 1 });
    expect(items.map((i) => i.category)).toEqual(['missing', 'unmatched']);
  });

  it('settles the invoice and flags only the extra payment when one is right and one is wrong', () => {
    const { items } = reconcile(
      [invoice('INV-1', 10000)],
      [payment('INV-1', 10000), payment('INV-1', 2500)],
    );

    expect(items.map((i) => [i.category, i.receivedCents])).toEqual([
      ['ok', 10000],
      ['unmatched', 2500],
    ]);
  });

  it('does not add partial payments together', () => {
    const { totals } = reconcile(
      [invoice('INV-1', 10000)],
      [payment('INV-1', 5000), payment('INV-1', 5000)],
    );

    expect(totals).toMatchObject({ ok: 0, missing: 1, unmatched: 2 });
  });

  it('compares amounts to the cent', () => {
    const { totals } = reconcile([invoice('INV-1', 1999)], [payment('INV-1', 2000)]);

    expect(totals).toMatchObject({ ok: 0, missing: 1, unmatched: 1 });
  });

  it('handles empty input', () => {
    expect(reconcile([], [])).toEqual({
      totals: { invoices: 0, payments: 0, ok: 0, missing: 0, duplicate: 0, unmatched: 0 },
      items: [],
    });
  });

  it('gives the same findings whatever the order of the payments', () => {
    const invoices = [invoice('A', 100), invoice('B', 200), invoice('C', 300)];
    const payments = [payment('B', 200), payment('A', 100), payment('B', 200), payment('Z', 50)];

    const forward = reconcile(invoices, payments);
    const backward = reconcile(invoices, [...payments].reverse());

    expect(backward.totals).toEqual(forward.totals);
    const key = (r: typeof forward) => r.items.map((i) => `${i.category}:${i.reference}`).sort();
    expect(key(backward)).toEqual(key(forward));
  });

  it('accounts for every invoice and every payment exactly once', () => {
    const invoices = [invoice('A', 100), invoice('B', 200), invoice('C', 300)];
    const payments = [payment('A', 100), payment('B', 200), payment('B', 200), payment('Z', 50)];

    const { items, totals } = reconcile(invoices, payments);

    // Each invoice gives one item (ok, missing or duplicate); each unmatched payment gives one.
    const invoiceItems = items.filter((i) => i.category !== 'unmatched');
    expect(invoiceItems).toHaveLength(invoices.length);
    expect(totals.unmatched).toBe(1);
  });
});
