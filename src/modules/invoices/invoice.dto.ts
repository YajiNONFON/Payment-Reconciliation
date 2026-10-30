import { z } from 'zod';
import { amountField, dateField, referenceField, textField } from '../../lib/validators';

/** Columns expected in an invoices CSV (any order, case-insensitive). */
export const INVOICE_COLUMNS = ['reference', 'customer', 'amount', 'issue_date'] as const;

export const invoiceRowSchema = z.object({
  reference: referenceField,
  customer: textField('customer'),
  amount: amountField,
  issue_date: dateField('issue_date'),
});

export interface InvoiceInput {
  reference: string;
  customer: string;
  amountCents: number;
  /** YYYY-MM-DD */
  issueDate: string;
}

export interface InvoiceResponse {
  id: number;
  reference: string;
  customer: string;
  amountCents: number;
  /** YYYY-MM-DD */
  issueDate: string;
}
