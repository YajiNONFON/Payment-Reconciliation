# Payment Reconciliation

Match payments to invoices and flag what does not add up: unpaid invoices, payments made twice, and payments that match no invoice.

Upload two CSV files, get back a report. No spreadsheet, no line-by-line checking.

## What it finds

A payment settles an invoice only when the **reference and the amount both match, to the cent**. Everything else is reported.

| Result      | Meaning                                                               |
| ----------- | --------------------------------------------------------------------- |
| `ok`        | The invoice was paid once, for the right amount                       |
| `missing`   | No payment of the right amount (unpaid, or paid wrongly)              |
| `duplicate` | The invoice was paid in full more than once                           |
| `unmatched` | A payment that settles no invoice (unknown reference or wrong amount) |

One mistake can give two findings. An invoice of $540.00 paid as $450.00 is both an unpaid invoice and a payment that matches nothing. There is no fuzzy matching: a mistyped reference is reported, never guessed.

## See it work

The repository ships a demo dataset: 28 invoices and 30 payments with anomalies hidden in them. With the database running (see below):

```bash
npm run demo
```

```text
12 items need a second look. 20 invoices are fine.

Not paid (5)
  INV-1017  billed    $540.00  received      $0.00  Not paid in full. Payments with this reference have a different amount: $450.00.
  INV-1018  billed    $520.00  received      $0.00  No payment received.
  ...

Paid twice (3)
  INV-1004  billed    $199.00  received    $398.00  Paid 2 times. Refund due: $199.00.
  ...

No matching invoice (4)
  INV-1099  billed          -  received    $150.00  No invoice has this reference.
  ...
```

`npm run demo` replaces everything in the database with the demo files. Use it on a development database only.

## Stack

Node 24, Express 5, TypeScript, Prisma + PostgreSQL, zod, Vitest + supertest, Swagger UI. Amounts are integer US cents. Dates are `YYYY-MM-DD`.

## Quick start

```bash
cp .env.example .env
```

```bash
npm install
```

```bash
docker compose up -d db
```

```bash
npx prisma migrate deploy
```

```bash
npm run dev
```

The API listens on <http://localhost:5001>. Swagger UI is at <http://localhost:5001/docs>.

## Use it

1. `POST /api/invoices/import` with your invoices CSV (`Content-Type: text/csv`)
2. `POST /api/payments/import` with your payments CSV
3. `GET /api/reconciliation/report`

CSV formats, responses and errors are in [docs/API.md](docs/API.md).

## Scripts

| Command              | What it does                                   |
| -------------------- | ---------------------------------------------- |
| `npm run dev`        | Start the API with auto-reload                 |
| `npm run demo`       | Load the demo files and print the report       |
| `npm run seed`       | Load the demo files into an empty database     |
| `npm run seed:reset` | Same, after deleting all invoices and payments |
| `npm run check`      | Format check, lint, build and tests            |
| `npm run test:db`    | Run the tests that need PostgreSQL             |
| `npm run format`     | Format the code with Prettier                  |

## Tests

`npm test` runs the unit tests. The database tests run when `RUN_DB_TESTS=true` (`npm run test:db`); they use `TEST_DATABASE_URL`, whose database name must end with `_test` because the tests wipe the tables. CI runs everything against a PostgreSQL service.

The key test loads the demo files and checks that every hidden anomaly is found and that nothing else is reported.

## Design choices

Why amounts are in cents, why imports are all-or-nothing, why matching is exact and what is left out on purpose: [docs/DECISIONS.md](docs/DECISIONS.md).

## Not included

No bank API, no fuzzy or AI matching, no authentication, no front end. The API is documented with Swagger.

## License

MIT
