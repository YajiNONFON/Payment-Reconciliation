import { z } from 'zod';
import { isValidIsoDate } from './dates';
import { parseAmountToCents } from './money';

/** Invoice/payment reference: trimmed and upper-cased so "inv-001 " matches "INV-001". */
export const referenceField = z
  .string()
  .trim()
  .min(1, 'reference is required')
  .transform((value) => value.toUpperCase())
  .pipe(
    z
      .string()
      .regex(
        /^[A-Z0-9][A-Z0-9._/-]{0,49}$/,
        'reference must be 1 to 50 characters: letters, digits and . _ / -',
      ),
  );

/** Amount in US dollars as text ("125.50"), converted to integer cents. */
export const amountField = z
  .string()
  .trim()
  .min(1, 'amount is required')
  .transform((value, ctx) => {
    const cents = parseAmountToCents(value);
    if (cents === null) {
      ctx.addIssue({
        code: 'custom',
        message:
          'amount must be a positive number in US dollars with at most 2 decimals, using a dot (for example 125.50)',
      });
      return z.NEVER;
    }
    return cents;
  });

/** Calendar date written as YYYY-MM-DD. */
export const dateField = (name: string) =>
  z
    .string()
    .trim()
    .min(1, `${name} is required`)
    .refine(isValidIsoDate, { message: `${name} must be a valid date written as YYYY-MM-DD` });

/** Non-empty free text (customer or payer name). */
export const textField = (name: string) =>
  z
    .string()
    .trim()
    .min(1, `${name} is required`)
    .max(120, `${name} must be at most 120 characters`);
