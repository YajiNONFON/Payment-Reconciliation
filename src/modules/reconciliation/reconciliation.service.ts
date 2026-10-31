import type { Reconciliation } from './reconciliation.dto';
import { reconcile } from './reconciliation.engine';
import * as reconciliationRepository from './reconciliation.repository';

/** Reconciles everything currently in the database. */
export async function run(): Promise<Reconciliation> {
  const [invoices, payments] = await Promise.all([
    reconciliationRepository.findInvoices(),
    reconciliationRepository.findPayments(),
  ]);
  return reconcile(invoices, payments);
}
