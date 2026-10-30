import { parseCsv, throwImportErrors, validateCsvRows } from '../../lib/csv';
import { formatDateOnly } from '../../lib/dates';
import { PAYMENT_COLUMNS, paymentRowSchema, type PaymentResponse } from './payment.dto';
import * as paymentRepository from './payment.repository';

/**
 * The same reference may legitimately appear several times in a payments file:
 * spotting that is the job of the reconciliation, not of the import.
 */
export async function importFromCsv(csv: string): Promise<{ imported: number }> {
  const { rows, errors: structureErrors } = parseCsv(csv, PAYMENT_COLUMNS);
  const { valid, errors: valueErrors } = validateCsvRows(rows, paymentRowSchema);

  const errors = [...structureErrors, ...valueErrors];
  if (errors.length > 0) throwImportErrors(errors);

  const result = await paymentRepository.createMany(
    valid.map(({ data }) => ({
      reference: data.reference,
      payer: data.payer,
      amountCents: data.amount,
      paidDate: data.paid_date,
    })),
  );
  return { imported: result.count };
}

export async function list(): Promise<PaymentResponse[]> {
  const payments = await paymentRepository.findAll();
  return payments.map((payment) => ({
    id: payment.id,
    reference: payment.reference,
    payer: payment.payer,
    amountCents: payment.amountCents,
    paidDate: formatDateOnly(payment.paidDate),
  }));
}
