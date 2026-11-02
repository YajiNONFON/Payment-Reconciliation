# Design decisions

Each decision below was a real choice with an alternative. They are written down so the reasons survive the code.

## 1. Amounts are integer cents, in one currency

Amounts are stored and compared as integer US cents. Floating-point numbers cannot represent 19.99 exactly, and reconciliation depends on equality to the cent. The CSV amount is converted from text without any floating-point arithmetic. There is one currency (US dollars) on purpose.

## 2. Dates are plain dates

Dates are `YYYY-MM-DD`, stored in a date-only column. No time, no time zone, so a date never shifts depending on where the server runs.

## 3. CSV is sent as the raw request body

`Content-Type: text/csv`, not multipart upload. It keeps the API small (no upload library) and works from Swagger, curl and any front end.

## 4. Imports are all-or-nothing

A file is saved entirely or not at all. Every row is validated first and all errors are returned together, with their line number. The rows are inserted in a single statement. A half-imported file would produce false anomalies later, which is worse than a refused file.

## 5. Invoice references are unique, payment references are not

An invoice reference identifies the invoice, so it is unique in the file and in the database. A payment reference may repeat on purpose: the same reference paid twice is exactly what the engine must detect.

## 6. Exact matching only

A payment settles an invoice only when the reference **and** the amount are identical, to the cent. References are only trimmed and upper-cased on import (`inv-001 ` is `INV-001`). There is no fuzzy matching and no AI: a mistyped reference such as `INV-1O18` (letter O) is reported instead of guessed, so a person decides.

Consequence: one mistake can give two findings. An invoice paid with the wrong amount is both `missing` (the invoice was not paid in full) and `unmatched` (the payment settles nothing). That is what the person doing the books needs to see.

## 7. The four categories

- `ok`: exactly one payment of the right amount.
- `missing`: no payment of the right amount.
- `duplicate`: more than one payment of the right amount. The note states the refund due.
- `unmatched`: a payment whose reference is unknown, or whose amount differs from its invoice.

If an invoice has one right payment and one wrong one, the invoice is `ok` and only the extra payment is `unmatched`.

## 8. Partial payments are not combined

Two payments of $50.00 do not settle an invoice of $100.00: the invoice is `missing` and both payments are `unmatched`. Combining payments needs rules (how many, how long after) that belong to a real business, not to a first version. It is the first thing to add if real data needs it.

## 9. The engine is a pure function

`reconcile(invoices, payments)` has no database, no clock and no randomness. The same input always gives the same result, and the order of the payments does not matter. The database is reached only through a repository, so the engine is tested without a database.

## 10. The report is computed, not stored

`GET /api/reconciliation/report` recomputes from the current data on every call. There is no report table to keep in sync, and the report can never be out of date.

## 11. One set of demo files for the tests and the demo

The 28 invoices and 30 payments in `tests/fixtures/` are used by the tests and by `npm run seed` and `npm run demo`. The demo and the tests cannot drift apart: if the demo shows an anomaly, a test asserts it.

## 12. Database tests never touch the development database

They run only when `RUN_DB_TESTS=true`, on a database whose name ends with `_test`, and refuse anything else because they wipe the tables. The database test files run one at a time because they share that database.

## 13. Left out on purpose

No bank API, no fuzzy or AI matching, no authentication, no front end in this repository. The API is documented with Swagger. The project does one thing: find what does not add up.
