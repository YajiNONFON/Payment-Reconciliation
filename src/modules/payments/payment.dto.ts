import { z } from 'zod';
import { amountField, dateField, referenceField, textField } from '../../lib/validators';

/** Columns expected in a payments CSV (any order, case-insensitive). */
export const PAYMENT_COLUMNS = ['reference', 'payer', 'amount', 'paid_date'] as const;

export const paymentRowSchema = z.object({
  reference: referenceField,
  payer: textField('payer'),
  amount: amountField,
  paid_date: dateField('paid_date'),
});

export interface PaymentInput {
  reference: string;
  payer: string;
  amountCents: number;
  /** YYYY-MM-DD */
  paidDate: string;
}

export interface PaymentResponse {
  id: number;
  reference: string;
  payer: string;
  amountCents: number;
  /** YYYY-MM-DD */
  paidDate: string;
}
