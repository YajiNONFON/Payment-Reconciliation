import { readFileSync } from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';
import { disconnectPrisma } from '../../src/lib/prisma';
import { dbTestsEnabled, resetDatabase } from '../helpers/db';

const fixture = (name: string) =>
  readFileSync(path.join(__dirname, '..', 'fixtures', name), 'utf8');

// Needs PostgreSQL: run with RUN_DB_TESTS=true (see README).
describe.skipIf(!dbTestsEnabled)('CSV import (database)', () => {
  const app = createApp();

  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  const postCsv = (url: string, csv: string) =>
    request(app).post(url).set('Content-Type', 'text/csv').send(csv);

  it('imports invoices and lists them with cents and YYYY-MM-DD dates', async () => {
    const res = await postCsv('/api/invoices/import', fixture('invoices.csv'));
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ imported: 3 });

    const list = await request(app).get('/api/invoices');
    expect(list.status).toBe(200);
    expect(list.body.data).toEqual([
      expect.objectContaining({
        reference: 'INV-001',
        amountCents: 12550,
        issueDate: '2026-10-01',
      }),
      expect.objectContaining({ reference: 'INV-002', amountCents: 8000, issueDate: '2026-10-03' }),
      expect.objectContaining({ reference: 'INV-003', amountCents: 1999, issueDate: '2026-10-04' }),
    ]);
  });

  it('imports payments and keeps repeated references', async () => {
    const res = await postCsv('/api/payments/import', fixture('payments.csv'));
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ imported: 3 });

    const list = await request(app).get('/api/payments');
    const references = (list.body.data as { reference: string }[]).map((p) => p.reference);
    expect(references).toEqual(['INV-001', 'INV-002', 'INV-002']);
    expect(list.body.data[0]).toMatchObject({ amountCents: 12550, paidDate: '2026-10-05' });
  });

  it('saves nothing when one row is invalid', async () => {
    const csv =
      'reference,customer,amount,issue_date\nINV-001,Acme,10,2026-10-01\nINV-002,Globex,oops,2026-10-02\n';
    const res = await postCsv('/api/invoices/import', csv);
    expect(res.status).toBe(422);

    const list = await request(app).get('/api/invoices');
    expect(list.body.data).toEqual([]);
  });

  it('refuses to import an invoice reference twice', async () => {
    await postCsv('/api/invoices/import', fixture('invoices.csv'));
    const again = await postCsv('/api/invoices/import', fixture('invoices.csv'));

    expect(again.status).toBe(422);
    expect(JSON.stringify(again.body.error.details)).toContain('already exists in the database');

    const list = await request(app).get('/api/invoices');
    expect(list.body.data).toHaveLength(3);
  });
});
