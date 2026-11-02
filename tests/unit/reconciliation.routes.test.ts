import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app';
import * as reconciliationService from '../../src/modules/reconciliation/reconciliation.service';

vi.mock('../../src/modules/reconciliation/reconciliation.service');

describe('GET /api/reconciliation/report', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns the report as JSON', async () => {
    const report = {
      generatedAt: '2026-11-01T09:00:00.000Z',
      totals: { invoices: 1, payments: 2, ok: 0, missing: 0, duplicate: 1, unmatched: 0 },
      items: [
        {
          category: 'duplicate' as const,
          reference: 'INV-1',
          expectedCents: 5000,
          receivedCents: 10000,
          paymentCount: 2,
          note: 'Paid 2 times. Refund due: $50.00.',
        },
      ],
    };
    vi.mocked(reconciliationService.report).mockResolvedValue(report);

    const res = await request(createApp()).get('/api/reconciliation/report');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(report);
  });

  it('is described in the OpenAPI document', async () => {
    const res = await request(createApp()).get('/docs.json');

    expect(res.body.paths['/api/reconciliation/report'].get).toBeDefined();
    expect(res.body.components.schemas.Report).toBeDefined();
  });
});
