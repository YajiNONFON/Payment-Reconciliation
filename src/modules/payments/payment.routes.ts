import express, { Router } from 'express';
import * as paymentController from './payment.controller';

export const paymentRouter = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 1 }
 *         reference: { type: string, example: INV-001 }
 *         payer: { type: string, example: Acme Ltd }
 *         amountCents: { type: integer, description: Amount in US cents, example: 12550 }
 *         paidDate: { type: string, format: date, example: '2026-10-05' }
 */

/**
 * @openapi
 * /api/payments/import:
 *   post:
 *     tags: [Payments]
 *     summary: Import payments from a CSV
 *     description: |
 *       Send the CSV as the raw request body (Content-Type: text/csv).
 *       Header: `reference,payer,amount,paid_date`. Amounts are US dollars
 *       with a dot (`125.50`), dates are `YYYY-MM-DD`.
 *       The import is all-or-nothing: if any row is invalid, nothing is saved.
 *       The same reference may appear several times (the reconciliation reports it).
 *       Importing the same file twice stores its rows twice.
 *     requestBody:
 *       required: true
 *       content:
 *         text/csv:
 *           schema: { type: string }
 *           example: |
 *             reference,payer,amount,paid_date
 *             INV-001,Acme Ltd,125.50,2026-10-05
 *             INV-002,Globex,80,2026-10-06
 *     responses:
 *       201:
 *         description: All rows were imported
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ImportResult' }
 *       413: { $ref: '#/components/responses/Error' }
 *       415: { $ref: '#/components/responses/Error' }
 *       422:
 *         description: The file is invalid. Nothing was imported.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
paymentRouter.post(
  '/import',
  express.text({ type: ['text/csv', 'text/plain'], limit: '1mb' }),
  paymentController.importPayments,
);

/**
 * @openapi
 * /api/payments:
 *   get:
 *     tags: [Payments]
 *     summary: List imported payments
 *     responses:
 *       200:
 *         description: All payments, oldest first
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Payment' }
 */
paymentRouter.get('/', paymentController.listPayments);
