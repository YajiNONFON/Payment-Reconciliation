/**
 * ok         the invoice has exactly one payment of the right amount
 * missing    the invoice has no payment of the right amount
 * duplicate  the invoice was paid in full more than once
 * unmatched  the payment matches no invoice (unknown reference, or wrong amount)
 */
export type Category = 'ok' | 'missing' | 'duplicate' | 'unmatched';

export interface InvoiceRecord {
  reference: string;
  amountCents: number;
}

export interface PaymentRecord {
  reference: string;
  amountCents: number;
}

export interface ReportItem {
  category: Category;
  reference: string;
  /** What the invoice says. Null when no invoice has this reference. */
  expectedCents: number | null;
  /** What was actually received for this item. */
  receivedCents: number;
  paymentCount: number;
  note: string;
}

export type Totals = { invoices: number; payments: number } & Record<Category, number>;

export interface Reconciliation {
  totals: Totals;
  items: ReportItem[];
}
