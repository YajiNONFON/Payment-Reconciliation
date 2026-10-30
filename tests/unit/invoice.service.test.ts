import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../../src/lib/errors';
import * as repository from '../../src/modules/invoices/invoice.repository';
import * as service from '../../src/modules/invoices/invoice.service';

vi.mock('../../src/modules/invoices/invoice.repository');

const HEADER = 'reference,customer,amount,issue_date\n';

async function importError(csv: string): Promise<AppError> {
  try {
    await service.importFromCsv(csv);
  } catch (error) {
    if (error instanceof AppError) return error;
    throw error;
  }
  throw new Error('Expected the import to fail');
}

describe('invoice import', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(repository.findExistingReferences).mockResolvedValue([]);
    vi.mocked(repository.createMany).mockImplementation(({ length }) =>
      Promise.resolve({ count: length }),
    );
  });

  it('stores amounts in cents and normalizes references', async () => {
    const result = await service.importFromCsv(
      `${HEADER} inv-001 ,Acme Ltd,125.50,2026-10-01\nINV-002,Globex,80,2026-10-03\n`,
    );

    expect(result).toEqual({ imported: 2 });
    expect(repository.createMany).toHaveBeenCalledWith([
      { reference: 'INV-001', customer: 'Acme Ltd', amountCents: 12550, issueDate: '2026-10-01' },
      { reference: 'INV-002', customer: 'Globex', amountCents: 8000, issueDate: '2026-10-03' },
    ]);
  });

  it('reports every bad row at once, with line and field, and saves nothing', async () => {
    const error = await importError(
      `${HEADER}INV-001,Acme,12.345,2026-10-01\nINV-002,,50,2026-13-40\nINV-003,Globex,50,2026-10-03\n`,
    );

    expect(error.status).toBe(422);
    expect(error.code).toBe('CSV_VALIDATION_FAILED');
    const { errors } = error.details as { errors: { line: number; field?: string }[] };
    expect(errors.map((e) => [e.line, e.field])).toEqual([
      [2, 'amount'],
      [3, 'customer'],
      [3, 'issue_date'],
    ]);
    expect(repository.createMany).not.toHaveBeenCalled();
    expect(repository.findExistingReferences).not.toHaveBeenCalled();
  });

  it('rejects a reference used twice in the same file', async () => {
    const error = await importError(
      `${HEADER}INV-001,Acme,10,2026-10-01\nINV-001,Acme,10,2026-10-02\n`,
    );
    expect(JSON.stringify(error.details)).toContain('already used on line 2');
    expect(repository.createMany).not.toHaveBeenCalled();
  });

  it('rejects a reference that already exists in the database', async () => {
    vi.mocked(repository.findExistingReferences).mockResolvedValue(['INV-002']);
    const error = await importError(
      `${HEADER}INV-001,Acme,10,2026-10-01\nINV-002,Globex,20,2026-10-02\n`,
    );
    expect(JSON.stringify(error.details)).toContain('INV-002 already exists in the database');
    expect(repository.createMany).not.toHaveBeenCalled();
  });

  it('turns a unique-index race into a 409', async () => {
    vi.mocked(repository.createMany).mockRejectedValue(
      Object.assign(new Error('x'), { code: 'P2002' }),
    );
    const error = await importError(`${HEADER}INV-001,Acme,10,2026-10-01\n`);
    expect(error.status).toBe(409);
  });
});
