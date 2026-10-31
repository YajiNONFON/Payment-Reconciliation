import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseCsv, validateCsvRows } from '../../src/lib/csv';
import { INVOICE_COLUMNS, invoiceRowSchema } from '../../src/modules/invoices/invoice.dto';
import { PAYMENT_COLUMNS, paymentRowSchema } from '../../src/modules/payments/payment.dto';
import { reconcile } from '../../src/modules/reconciliation/reconciliation.engine';

const fixture = (name: string) =>
  readFileSync(path.join(__dirname, '..', 'fixtures', name), 'utf8');

function loadDemo() {
  const invoices = validateCsvRows(
    parseCsv(fixture('demo-invoices.csv'), INVOICE_COLUMNS).rows,
    invoiceRowSchema,
  );
  const payments = validateCsvRows(
    parseCsv(fixture('demo-payments.csv'), PAYMENT_COLUMNS).rows,
    paymentRowSchema,
  );
  expect([...invoices.errors, ...payments.errors]).toEqual([]);
  return reconcile(
    invoices.valid.map(({ data }) => ({ reference: data.reference, amountCents: data.amount })),
    payments.valid.map(({ data }) => ({ reference: data.reference, amountCents: data.amount })),
  );
}

const refs = (items: { category: string; reference: string }[], category: string) =>
  items
    .filter((i) => i.category === category)
    .map((i) => i.reference)
    .sort();

// The demo file is the "done when" test of the project:
// every hidden anomaly is found, and nothing else is reported.
describe('demo files (28 invoices, 30 payments)', () => {
  const { items, totals } = loadDemo();

  it('counts what the file contains', () => {
    expect(totals).toEqual({
      invoices: 28,
      payments: 30,
      ok: 20,
      missing: 5,
      duplicate: 3,
      unmatched: 4,
    });
  });

  it('finds the three invoices paid twice', () => {
    expect(refs(items, 'duplicate')).toEqual(['INV-1004', 'INV-1011', 'INV-1019']);
  });

  it('finds the five invoices that were not paid in full', () => {
    // 1022, 1024 and 1027 never paid; 1017 paid 450.00 instead of 540.00; 1018 paid under a mistyped reference.
    expect(refs(items, 'missing')).toEqual([
      'INV-1017',
      'INV-1018',
      'INV-1022',
      'INV-1024',
      'INV-1027',
    ]);
  });

  it('finds the four payments that settle no invoice', () => {
    expect(refs(items, 'unmatched')).toEqual(['INV-1017', 'INV-1099', 'INV-1O18', 'INV-2041']);
  });

  it('has no false positive: the 20 clean invoices are all ok', () => {
    const flagged = new Set(items.filter((i) => i.category !== 'ok').map((i) => i.reference));
    const ok = items.filter((i) => i.category === 'ok');
    expect(ok).toHaveLength(20);
    expect(ok.some((i) => flagged.has(i.reference))).toBe(false);
  });
});
