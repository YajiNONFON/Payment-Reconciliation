import type { Request, Response } from 'express';
import { readCsvBody } from '../../lib/http';
import * as invoiceService from './invoice.service';

export async function importInvoices(req: Request, res: Response): Promise<void> {
  const result = await invoiceService.importFromCsv(readCsvBody(req));
  res.status(201).json(result);
}

export async function listInvoices(_req: Request, res: Response): Promise<void> {
  const data = await invoiceService.list();
  res.json({ data });
}
