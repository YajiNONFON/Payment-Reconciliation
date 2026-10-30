# Payment Reconciliation

Compare a list of payments with a list of invoices and flag what does not add up: missing payments, duplicates and payments that match no invoice.

> **Status: day 1 of 3.** CSV import for invoices and payments is done. The matching engine (day 2) and the anomaly report (day 3) are next.

## Stack

Node 24, Express 5, TypeScript, Prisma + PostgreSQL, zod, Vitest + supertest, Swagger UI. Amounts are stored as integer US cents. Dates are `YYYY-MM-DD`.

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

## Import format

Send the CSV text as the request body with `Content-Type: text/csv`. Columns can be in any order and extra columns are ignored.

`POST /api/invoices/import`

```csv
reference,customer,amount,issue_date
INV-001,Acme Ltd,125.50,2026-10-01
```

`POST /api/payments/import`

```csv
reference,payer,amount,paid_date
INV-001,Acme Ltd,125.50,2026-10-05
```

- `amount` is a decimal US-dollar value with at most two decimals (`125`, `125.50`). It is converted to integer cents without floating-point maths.
- References are trimmed and upper-cased (`inv-001 ` becomes `INV-001`).
- A file is imported **entirely or not at all**: if one row is invalid, nothing is saved and the response (`422`) lists every error with its line number.
- An invoice reference must be unique. A payment reference may repeat on purpose: that is how duplicates are detected on day 2.

`GET /api/invoices` and `GET /api/payments` list what was imported.

## Scripts

| Command           | What it does                        |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Start the API with auto-reload      |
| `npm run check`   | Format check, lint, build and tests |
| `npm run test:db` | Run the tests that need PostgreSQL  |
| `npm run format`  | Format the code with Prettier       |

## Tests

`npm test` runs the unit tests only. The database tests run when `RUN_DB_TESTS=true` (`npm run test:db`); they use `TEST_DATABASE_URL`, whose database name must end with `_test` because the tests wipe the tables. CI runs everything against a PostgreSQL service.

## License

MIT
