import { Router } from 'express';
import { invoiceRouter } from './modules/invoices/invoice.routes';
import { paymentRouter } from './modules/payments/payment.routes';

export const apiRouter = Router();

apiRouter.use('/invoices', invoiceRouter);
apiRouter.use('/payments', paymentRouter);
