import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../../src/lib/errors';
import * as repository from '../../src/modules/payments/payment.repository';
import * as service from '../../src/modules/payments/payment.service';

vi.mock('../../src/modules/payments/payment.repository');

const HEADER = 'reference,payer,amount,paid_date\n';

describe('payment import', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(repository.createMany).mockImplementation(({ length }) =>
      Promise.resolve({ count: length }),
    );
  });

  it('keeps repeated references: finding them is the reconciliation job', async () => {
    const result = await service.importFromCsv(
      `${HEADER}INV-001,Acme,125.50,2026-10-05\nINV-001,Acme,125.50,2026-10-06\n`,
    );

    expect(result).toEqual({ imported: 2 });
    expect(repository.createMany).toHaveBeenCalledWith([
      { reference: 'INV-001', payer: 'Acme', amountCents: 12550, paidDate: '2026-10-05' },
      { reference: 'INV-001', payer: 'Acme', amountCents: 12550, paidDate: '2026-10-06' },
    ]);
  });

  it('rejects the whole file when one row is invalid', async () => {
    await expect(
      service.importFromCsv(
        `${HEADER}INV-001,Acme,125.50,2026-10-05\nINV-002,Globex,-3,2026-10-06\n`,
      ),
    ).rejects.toMatchObject({ status: 422, code: 'CSV_VALIDATION_FAILED' });
    expect(repository.createMany).not.toHaveBeenCalled();
  });

  it('is an AppError so the API answers with a clean 422', async () => {
    await expect(service.importFromCsv(`${HEADER}`)).rejects.toBeInstanceOf(AppError);
  });
});
