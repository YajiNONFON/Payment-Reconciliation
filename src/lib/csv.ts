import { CsvError, parse } from 'csv-parse/sync';
import type { z } from 'zod';
import { AppError } from './errors';

export interface CsvRow {
  /** Line number in the uploaded file (the header is line 1). */
  line: number;
  values: Record<string, string>;
}

export interface RowError {
  line: number;
  field?: string;
  message: string;
}

export interface ParsedCsv {
  rows: CsvRow[];
  errors: RowError[];
}

export interface ValidRow<T> {
  line: number;
  data: T;
}

interface RawRecord {
  record: string[];
  info: { lines: number };
}

/**
 * Parses CSV text. Column names are matched case-insensitively and in any order;
 * extra columns are ignored. File-level problems (empty file, missing column,
 * broken quoting) throw a 422; row-level problems are returned in `errors`.
 */
export function parseCsv(text: string, requiredColumns: readonly string[]): ParsedCsv {
  let records: RawRecord[];
  try {
    records = parse(text, {
      bom: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      info: true,
    }) as unknown as RawRecord[]; // with `info: true` each record is { record, info }
  } catch (error) {
    if (error instanceof CsvError) {
      throw new AppError(422, 'CSV_MALFORMED', `The CSV could not be read: ${error.message}`);
    }
    throw error;
  }

  const [headerRecord, ...dataRecords] = records;
  if (!headerRecord) {
    throw new AppError(422, 'CSV_EMPTY', 'The CSV is empty. Send a header line and data rows.');
  }

  const header = headerRecord.record.map((name) => name.trim().toLowerCase());
  const expected = requiredColumns.join(',');

  if (header.length === 1 && /[;\t]/.test(header[0] ?? '')) {
    throw new AppError(
      422,
      'CSV_INVALID_HEADER',
      `The header uses ";" or tabs as separator. Use commas. Expected header: ${expected}`,
    );
  }

  const duplicated = header.filter((name, index) => header.indexOf(name) !== index);
  if (duplicated.length > 0) {
    throw new AppError(
      422,
      'CSV_INVALID_HEADER',
      `Duplicate column(s) in the header: ${[...new Set(duplicated)].join(', ')}`,
    );
  }

  const missing = requiredColumns.filter((name) => !header.includes(name));
  if (missing.length > 0) {
    throw new AppError(
      422,
      'CSV_INVALID_HEADER',
      `Missing required column(s): ${missing.join(', ')}. Expected header: ${expected}`,
    );
  }

  if (dataRecords.length === 0) {
    throw new AppError(422, 'CSV_NO_ROWS', 'The CSV has a header but no data rows.');
  }

  const rows: CsvRow[] = [];
  const errors: RowError[] = [];

  for (const { record, info } of dataRecords) {
    if (record.length !== header.length) {
      errors.push({
        line: info.lines,
        message: `Expected ${header.length} columns but found ${record.length}`,
      });
      continue;
    }
    const values: Record<string, string> = {};
    for (const column of requiredColumns) {
      values[column] = record[header.indexOf(column)] ?? '';
    }
    rows.push({ line: info.lines, values });
  }

  return { rows, errors };
}

/** Validates every row against a zod schema and collects all the errors, not just the first. */
export function validateCsvRows<T>(
  rows: CsvRow[],
  schema: z.ZodType<T>,
): { valid: ValidRow<T>[]; errors: RowError[] } {
  const valid: ValidRow<T>[] = [];
  const errors: RowError[] = [];

  for (const row of rows) {
    const result = schema.safeParse(row.values);
    if (result.success) {
      valid.push({ line: row.line, data: result.data });
      continue;
    }
    for (const issue of result.error.issues) {
      const field = issue.path[0];
      errors.push({
        line: row.line,
        ...(typeof field === 'string' ? { field } : {}),
        message: issue.message,
      });
    }
  }

  return { valid, errors };
}

const MAX_REPORTED_ERRORS = 100;

/** Throws the standard 422 for an import that has row errors. Nothing is saved. */
export function throwImportErrors(errors: RowError[]): never {
  const sorted = [...errors].sort((a, b) => a.line - b.line);
  throw new AppError(
    422,
    'CSV_VALIDATION_FAILED',
    `${sorted.length} error(s) found. Nothing was imported. Fix the file and send it again.`,
    { errorCount: sorted.length, errors: sorted.slice(0, MAX_REPORTED_ERRORS) },
  );
}
