import type { Request, Response } from 'express';
import { readCsvBody } from '../../lib/http';
import * as paymentService from './payment.service';

export async function importPayments(req: Request, res: Response): Promise<void> {
  const result = await paymentService.importFromCsv(readCsvBody(req));
  res.status(201).json(result);
}

export async function listPayments(_req: Request, res: Response): Promise<void> {
  const data = await paymentService.list();
  res.json({ data });
}
