import type { Request, Response } from 'express';
import * as reconciliationService from './reconciliation.service';

export async function getReport(_req: Request, res: Response): Promise<void> {
  res.json(await reconciliationService.report());
}
