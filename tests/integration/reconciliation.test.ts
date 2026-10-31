import { readFileSync } from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';
import { disconnectPrisma } from '../../src/lib/prisma';
import * as reconciliationService from '../../src/modules/reconciliation/reconciliation.service';
import { dbTestsEnabled, resetDatabase } from '../helpers/db';

const fixture = (name: string) =>
  readFileSync(path.join(__dirname, '..', 'fixtures', name), 'utf8');

// Needs PostgreSQL: run with RUN_DB_TESTS=true (see README).
describe.skipIf(!dbTestsEnabled)('reconciliation (database)', () => {
  const app = createApp();

  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  it('reconciles what was imported from the demo files', async () => {
    const post = (url: string, csv: string) =>
      request(app).post(url).set('Content-Type', 'text/csv').send(csv);
    await post('/api/invoices/import', fixture('demo-invoices.csv')).expect(201);
    await post('/api/payments/import', fixture('demo-payments.csv')).expect(201);

    const { totals } = await reconciliationService.run();

    expect(totals).toEqual({
      invoices: 28,
      payments: 30,
      ok: 20,
      missing: 5,
      duplicate: 3,
      unmatched: 4,
    });
  });

  it('returns an empty reconciliation on an empty database', async () => {
    const { totals, items } = await reconciliationService.run();

    expect(items).toEqual([]);
    expect(totals.ok + totals.missing + totals.duplicate + totals.unmatched).toBe(0);
  });
});
