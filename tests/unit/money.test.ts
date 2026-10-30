import { describe, expect, it } from 'vitest';
import { parseAmountToCents } from '../../src/lib/money';

describe('parseAmountToCents', () => {
  it.each([
    ['125.50', 12550],
    ['125', 12500],
    ['0.99', 99],
    ['19.99', 1999],
    ['1.5', 150],
    [' 7.10 ', 710],
    ['21474836.47', 2147483647],
  ])('converts %s to %i cents', (input, expected) => {
    expect(parseAmountToCents(input)).toBe(expected);
  });

  it.each(['', '0', '0.00', '-5', '12,50', '1.234', '$5', '1e3', 'abc', '21474836.48', '5.'])(
    'rejects "%s"',
    (input) => {
      expect(parseAmountToCents(input)).toBeNull();
    },
  );
});
