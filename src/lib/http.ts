import type { Request } from 'express';
import { AppError } from './errors';

/** The CSV is sent as the raw request body with Content-Type: text/csv. */
export function readCsvBody(req: Request): string {
  const body: unknown = req.body;
  if (typeof body !== 'string') {
    throw new AppError(
      415,
      'UNSUPPORTED_MEDIA_TYPE',
      'Send the CSV as the raw request body with Content-Type: text/csv',
    );
  }
  return body;
}
