import { describe, expect, it } from 'vitest';
import { formatDateOnly, isValidIsoDate, toDateOnly } from '../../src/lib/dates';

describe('dates', () => {
  it('accepts real calendar dates', () => {
    expect(isValidIsoDate('2026-10-29')).toBe(true);
    expect(isValidIsoDate('2028-02-29')).toBe(true);
  });

  it.each([
    '2026-02-30',
    '2027-02-29',
    '2026-13-01',
    '29/10/2026',
    '2026-1-5',
    '',
    '2026-10-29T10:00',
  ])('rejects "%s"', (value) => {
    expect(isValidIsoDate(value)).toBe(false);
  });

  it('round-trips without a timezone shift', () => {
    expect(formatDateOnly(toDateOnly('2026-10-01'))).toBe('2026-10-01');
  });
});
