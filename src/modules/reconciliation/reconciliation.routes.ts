import { Router } from 'express';
import * as reconciliationController from './reconciliation.controller';

export const reconciliationRouter = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     ReportItem:
 *       type: object
 *       properties:
 *         category:
 *           type: string
 *           enum: [ok, missing, duplicate, unmatched]
 *           description: |
 *             `ok`: paid once, for the right amount.
 *             `missing`: no payment of the right amount.
 *             `duplicate`: paid in full more than once.
 *             `unmatched`: a payment that settles no invoice.
 *         reference: { type: string, example: INV-1004 }
 *         expectedCents:
 *           type: integer
 *           nullable: true
 *           description: What the invoice says, in US cents. Null when no invoice has this reference.
 *           example: 19900
 *         receivedCents:
 *           type: integer
 *           description: What was received for this item, in US cents.
 *           example: 39800
 *         paymentCount: { type: integer, example: 2 }
 *         note: { type: string, example: 'Paid 2 times. Refund due: $199.00.' }
 *     Report:
 *       type: object
 *       properties:
 *         generatedAt: { type: string, format: date-time }
 *         totals:
 *           type: object
 *           properties:
 *             invoices: { type: integer, example: 28 }
 *             payments: { type: integer, example: 30 }
 *             ok: { type: integer, example: 20 }
 *             missing: { type: integer, example: 5 }
 *             duplicate: { type: integer, example: 3 }
 *             unmatched: { type: integer, example: 4 }
 *         items:
 *           type: array
 *           items: { $ref: '#/components/schemas/ReportItem' }
 */

/**
 * @openapi
 * /api/reconciliation/report:
 *   get:
 *     tags: [Reconciliation]
 *     summary: Anomaly report
 *     description: |
 *       Matches every payment to an invoice on exact reference and exact amount,
 *       and lists the result for every invoice and every unmatched payment.
 *       The report is computed on request from what is currently in the database.
 *       With no data it returns zero totals and an empty list.
 *     responses:
 *       200:
 *         description: The report
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Report' }
 */
reconciliationRouter.get('/report', reconciliationController.getReport);
