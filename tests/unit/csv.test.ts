import { describe, expect, it } from 'vitest';
import { parseCsv } from '../../src/lib/csv';
import { AppError } from '../../src/lib/errors';

const COLUMNS = ['reference', 'amount'] as const;

function codeOf(fn: () => unknown): string {
  try {
    fn();
  } catch (error) {
    if (error instanceof AppError) return error.code;
    throw error;
  }
  throw new Error('Expected the call to throw');
}

describe('parseCsv', () => {
  it('reads rows and reports the real line numbers, blank lines included', () => {
    const { rows, errors } = parseCsv('reference,amount\nA,1\n\nB,2\n', COLUMNS);
    expect(errors).toEqual([]);
    expect(rows).toEqual([
      { line: 2, values: { reference: 'A', amount: '1' } },
      { line: 4, values: { reference: 'B', amount: '2' } },
    ]);
  });

  it('accepts a BOM, CRLF, any column order, any case and extra columns', () => {
    const text = '﻿Note, Amount ,REFERENCE\r\nhello,5,A\r\n';
    const { rows } = parseCsv(text, COLUMNS);
    expect(rows).toEqual([{ line: 2, values: { reference: 'A', amount: '5' } }]);
  });

  it('supports quoted values containing commas', () => {
    const { rows } = parseCsv('reference,amount\n"A,1",5\n', COLUMNS);
    expect(rows[0]?.values.reference).toBe('A,1');
  });

  it('reports rows with the wrong number of columns without stopping', () => {
    const { rows, errors } = parseCsv('reference,amount\nA,1\nB\nC,3,9\nD,4\n', COLUMNS);
    expect(rows.map((row) => row.line)).toEqual([2, 5]);
    expect(errors).toEqual([
      { line: 3, message: 'Expected 2 columns but found 1' },
      { line: 4, message: 'Expected 2 columns but found 3' },
    ]);
  });

  it('rejects an empty file', () => {
    expect(codeOf(() => parseCsv('', COLUMNS))).toBe('CSV_EMPTY');
    expect(codeOf(() => parseCsv('\n\n', COLUMNS))).toBe('CSV_EMPTY');
  });

  it('rejects a file with a header only', () => {
    expect(codeOf(() => parseCsv('reference,amount\n', COLUMNS))).toBe('CSV_NO_ROWS');
  });

  it('rejects a missing column and names it', () => {
    expect(() => parseCsv('reference,total\nA,1\n', COLUMNS)).toThrow(
      /Missing required column\(s\): amount/,
    );
  });

  it('rejects duplicate columns', () => {
    expect(() => parseCsv('reference,amount,amount\nA,1,2\n', COLUMNS)).toThrow(/Duplicate column/);
  });

  it('explains the semicolon separator used by some spreadsheet exports', () => {
    expect(() => parseCsv('reference;amount\nA;1\n', COLUMNS)).toThrow(/Use commas/);
  });

  it('rejects broken quoting', () => {
    expect(codeOf(() => parseCsv('reference,amount\n"A,1\n', COLUMNS))).toBe('CSV_MALFORMED');
  });
});
