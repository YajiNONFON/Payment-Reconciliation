/** Largest amount that fits in a PostgreSQL INTEGER column (about $21.4 million). */
export const MAX_AMOUNT_CENTS = 2_147_483_647;

/**
 * Converts a decimal US-dollar string such as "125" or "125.50" to integer cents.
 * Works on the text only (no floating point), so 19.99 is exactly 1999.
 * Returns null for anything that is not a positive amount with at most 2 decimals.
 */
export function parseAmountToCents(input: string): number | null {
  const match = /^(\d{1,10})(?:\.(\d{1,2}))?$/.exec(input.trim());
  if (!match) return null;
  const dollars = Number(match[1]);
  const cents = Number((match[2] ?? '').padEnd(2, '0'));
  const total = dollars * 100 + cents;
  if (total <= 0 || total > MAX_AMOUNT_CENTS) return null;
  return total;
}
