import { Router } from 'express';
import { invoiceRouter } from './modules/invoices/invoice.routes';
import { paymentRouter } from './modules/payments/payment.routes';
import { reconciliationRouter } from './modules/reconciliation/reconciliation.routes';

export const apiRouter = Router();

apiRouter.use('/invoices', invoiceRouter);
apiRouter.use('/payments', paymentRouter);
apiRouter.use('/reconciliation', reconciliationRouter);
