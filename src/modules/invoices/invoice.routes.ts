import express, { Router } from 'express';
import * as invoiceController from './invoice.controller';

export const invoiceRouter = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Invoice:
 *       type: object
 *       properties:
 *         id: { type: integer, example: 1 }
 *         reference: { type: string, example: INV-001 }
 *         customer: { type: string, example: Acme Ltd }
 *         amountCents: { type: integer, description: Amount in US cents, example: 12550 }
 *         issueDate: { type: string, format: date, example: '2026-10-01' }
 */

/**
 * @openapi
 * /api/invoices/import:
 *   post:
 *     tags: [Invoices]
 *     summary: Import invoices from a CSV
 *     description: |
 *       Send the CSV as the raw request body (Content-Type: text/csv).
 *       Header: `reference,customer,amount,issue_date`. Amounts are US dollars
 *       with a dot (`125.50`), dates are `YYYY-MM-DD`.
 *       The import is all-or-nothing: if any row is invalid, nothing is saved.
 *     requestBody:
 *       required: true
 *       content:
 *         text/csv:
 *           schema: { type: string }
 *           example: |
 *             reference,customer,amount,issue_date
 *             INV-001,Acme Ltd,125.50,2026-10-01
 *             INV-002,Globex,80,2026-10-03
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
invoiceRouter.post(
  '/import',
  express.text({ type: ['text/csv', 'text/plain'], limit: '1mb' }),
  invoiceController.importInvoices,
);

/**
 * @openapi
 * /api/invoices:
 *   get:
 *     tags: [Invoices]
 *     summary: List imported invoices
 *     responses:
 *       200:
 *         description: All invoices, oldest first
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Invoice' }
 */
invoiceRouter.get('/', invoiceController.listInvoices);
