import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';

// None of these requests reach the database: they fail (or answer) before it.
const app = createApp();

describe('HTTP layer', () => {
  it('answers the health check', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('answers unknown routes with a JSON 404', async () => {
    const res = await request(app).get('/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('publishes the OpenAPI document with the import endpoints', async () => {
    const res = await request(app).get('/docs.json');
    expect(res.status).toBe(200);
    expect(Object.keys(res.body.paths)).toEqual(
      expect.arrayContaining([
        '/api/invoices/import',
        '/api/invoices',
        '/api/payments/import',
        '/api/payments',
      ]),
    );
  });

  it('serves the Swagger UI', async () => {
    const res = await request(app).get('/docs/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('swagger');
  });

  it('refuses an import that is not sent as text/csv', async () => {
    const res = await request(app).post('/api/invoices/import').send({ csv: 'x' });
    expect(res.status).toBe(415);
    expect(res.body.error.code).toBe('UNSUPPORTED_MEDIA_TYPE');
  });

  it('returns a 422 with the expected header when a column is missing', async () => {
    const res = await request(app)
      .post('/api/payments/import')
      .set('Content-Type', 'text/csv')
      .send('reference,payer,amount\nINV-001,Acme,10\n');
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('CSV_INVALID_HEADER');
    expect(res.body.error.message).toContain('paid_date');
  });

  it('returns row errors with line numbers for invalid values', async () => {
    const res = await request(app)
      .post('/api/payments/import')
      .set('Content-Type', 'text/csv')
      .send('reference,payer,amount,paid_date\nINV-001,Acme,ten,2026-10-05\n');
    expect(res.status).toBe(422);
    expect(res.body.error.details.errors).toEqual([
      expect.objectContaining({ line: 2, field: 'amount' }),
    ]);
  });

  it('refuses a body larger than 1 MB', async () => {
    const res = await request(app)
      .post('/api/invoices/import')
      .set('Content-Type', 'text/csv')
      .send('x'.repeat(1_100_000));
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });
});
