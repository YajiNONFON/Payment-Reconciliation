/** True when `value` is a real calendar date written as YYYY-MM-DD. */
export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** YYYY-MM-DD -> Date at UTC midnight (what a PostgreSQL DATE column expects). */
export function toDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

/** Date -> YYYY-MM-DD. */
export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}
