import { parseCsv, throwImportErrors, validateCsvRows, type RowError } from '../../lib/csv';
import { formatDateOnly } from '../../lib/dates';
import { AppError } from '../../lib/errors';
import { INVOICE_COLUMNS, invoiceRowSchema, type InvoiceResponse } from './invoice.dto';
import * as invoiceRepository from './invoice.repository';

export async function importFromCsv(csv: string): Promise<{ imported: number }> {
  const { rows, errors: structureErrors } = parseCsv(csv, INVOICE_COLUMNS);
  const { valid, errors: valueErrors } = validateCsvRows(rows, invoiceRowSchema);
  const errors: RowError[] = [...structureErrors, ...valueErrors];

  // A reference must be unique inside the file.
  const firstLineByReference = new Map<string, number>();
  for (const { line, data } of valid) {
    const firstLine = firstLineByReference.get(data.reference);
    if (firstLine === undefined) {
      firstLineByReference.set(data.reference, line);
    } else {
      errors.push({
        line,
        field: 'reference',
        message: `reference ${data.reference} is already used on line ${firstLine} of this file`,
      });
    }
  }

  if (errors.length > 0) throwImportErrors(errors);

  // ...and unique in the database. Checked only once the file itself is clean.
  const existing = new Set(
    await invoiceRepository.findExistingReferences([...firstLineByReference.keys()]),
  );
  for (const { line, data } of valid) {
    if (existing.has(data.reference)) {
      errors.push({
        line,
        field: 'reference',
        message: `reference ${data.reference} already exists in the database`,
      });
    }
  }
  if (errors.length > 0) throwImportErrors(errors);

  try {
    const result = await invoiceRepository.createMany(
      valid.map(({ data }) => ({
        reference: data.reference,
        customer: data.customer,
        amountCents: data.amount,
        issueDate: data.issue_date,
      })),
    );
    return { imported: result.count };
  } catch (error) {
    // Two imports racing each other: the unique index is the last line of defence.
    if ((error as { code?: string }).code === 'P2002') {
      throw new AppError(
        409,
        'DUPLICATE_REFERENCE',
        'An invoice reference already exists. Nothing was imported.',
      );
    }
    throw error;
  }
}

export async function list(): Promise<InvoiceResponse[]> {
  const invoices = await invoiceRepository.findAll();
  return invoices.map((invoice) => ({
    id: invoice.id,
    reference: invoice.reference,
    customer: invoice.customer,
    amountCents: invoice.amountCents,
    issueDate: formatDateOnly(invoice.issueDate),
  }));
}
