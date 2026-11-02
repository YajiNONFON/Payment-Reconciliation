import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { seedDemo } from '../../scripts/seed';
import { createApp } from '../../src/app';
import { disconnectPrisma } from '../../src/lib/prisma';
import { dbTestsEnabled, resetDatabase } from '../helpers/db';

// Needs PostgreSQL: run with RUN_DB_TESTS=true (see README).
describe.skipIf(!dbTestsEnabled)('anomaly report and seed (database)', () => {
  const app = createApp();

  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectPrisma();
  });

  it('reports every hidden anomaly of the seeded demo files', async () => {
    await seedDemo({ reset: false });

    const res = await request(app).get('/api/reconciliation/report');

    expect(res.status).toBe(200);
    expect(res.body.totals).toEqual({
      invoices: 28,
      payments: 30,
      ok: 20,
      missing: 5,
      duplicate: 3,
      unmatched: 4,
    });
    expect(typeof res.body.generatedAt).toBe('string');
    const duplicates = (res.body.items as { category: string; reference: string }[])
      .filter((item) => item.category === 'duplicate')
      .map((item) => item.reference);
    expect(duplicates).toEqual(['INV-1004', 'INV-1011', 'INV-1019']);
  });

  it('returns an empty report when nothing was imported', async () => {
    const res = await request(app).get('/api/reconciliation/report');

    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.totals.invoices).toBe(0);
  });

  it('refuses to seed a database that already has data', async () => {
    await seedDemo({ reset: false });

    await expect(seedDemo({ reset: false })).rejects.toThrow('already contains data');
  });

  it('replaces the data when asked to reset', async () => {
    await seedDemo({ reset: false });

    await expect(seedDemo({ reset: true })).resolves.toEqual({ invoices: 28, payments: 30 });
  });
});
