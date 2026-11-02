# API

Base URL: `http://localhost:5001`. Interactive documentation: `/docs` (Swagger UI), raw OpenAPI document: `/docs.json`.

Amounts in responses are **integer US cents** (`12550` is $125.50). Dates are `YYYY-MM-DD`.

## Import invoices

`POST /api/invoices/import`

Send the CSV as the raw request body with `Content-Type: text/csv` (maximum 1 MB).

```csv
reference,customer,amount,issue_date
INV-001,Acme Ltd,125.50,2026-10-01
INV-002,Globex,80,2026-10-03
```

- Columns can be in any order, names are case-insensitive, extra columns are ignored.
- `amount` is a US-dollar value with a dot and at most two decimals.
- A reference is trimmed and upper-cased. It must be unique, in the file and in the database.
- The import is all-or-nothing: if one row is invalid, nothing is saved.

Response `201`:

```json
{ "imported": 2 }
```

## Import payments

`POST /api/payments/import`

```csv
reference,payer,amount,paid_date
INV-001,Acme Ltd,125.50,2026-10-05
```

Same rules as invoices, except that a payment reference **may repeat**: the same reference paid twice is how a duplicate is detected.

Response `201`: `{ "imported": 1 }`

## List imported data

`GET /api/invoices` and `GET /api/payments` return `{ "data": [...] }`, oldest first.

```json
{
  "data": [
    {
      "id": 1,
      "reference": "INV-001",
      "customer": "Acme Ltd",
      "amountCents": 12550,
      "issueDate": "2026-10-01"
    }
  ]
}
```

## Anomaly report

`GET /api/reconciliation/report`

Computed on request from what is in the database. Nothing is stored. With no data, it returns zero totals and an empty list.

```json
{
  "generatedAt": "2026-11-02T09:00:00.000Z",
  "totals": {
    "invoices": 28,
    "payments": 30,
    "ok": 20,
    "missing": 5,
    "duplicate": 3,
    "unmatched": 4
  },
  "items": [
    {
      "category": "duplicate",
      "reference": "INV-1004",
      "expectedCents": 19900,
      "receivedCents": 39800,
      "paymentCount": 2,
      "note": "Paid 2 times. Refund due: $199.00."
    }
  ]
}
```

| Field           | Meaning                                                                  |
| --------------- | ------------------------------------------------------------------------ |
| `category`      | `ok`, `missing`, `duplicate` or `unmatched`                              |
| `reference`     | The invoice reference, or the payment reference for an unmatched payment |
| `expectedCents` | What the invoice says. `null` when no invoice has this reference         |
| `receivedCents` | What was received for this item                                          |
| `paymentCount`  | Number of payments behind this item                                      |
| `note`          | A plain-language explanation. Empty for `ok`                             |

Every invoice appears once (`ok`, `missing` or `duplicate`). Every payment that did not settle its invoice also appears once (`unmatched`).

## Errors

All errors share one shape:

```json
{
  "error": {
    "code": "CSV_VALIDATION_FAILED",
    "message": "2 error(s) found. Nothing was imported. Fix the file and send it again.",
    "details": {
      "errorCount": 2,
      "errors": [
        {
          "line": 2,
          "field": "amount",
          "message": "amount must be a positive number in US dollars with at most 2 decimals, using a dot (for example 125.50)"
        },
        {
          "line": 3,
          "field": "issue_date",
          "message": "issue_date must be a valid date written as YYYY-MM-DD"
        }
      ]
    }
  }
}
```

`line` is the line in the uploaded file; the header is line 1. At most 100 errors are listed; `errorCount` is the full count.

| Status | Code                                                              | When                                                        |
| ------ | ----------------------------------------------------------------- | ----------------------------------------------------------- |
| 409    | `DUPLICATE_REFERENCE`                                             | Two imports of the same invoice reference raced each other  |
| 413    | `PAYLOAD_TOO_LARGE`                                               | The body is larger than 1 MB                                |
| 415    | `UNSUPPORTED_MEDIA_TYPE`                                          | The CSV was not sent as `text/csv` or `text/plain`          |
| 422    | `CSV_VALIDATION_FAILED`                                           | One or more rows are invalid, or a reference already exists |
| 422    | `CSV_EMPTY`, `CSV_NO_ROWS`, `CSV_INVALID_HEADER`, `CSV_MALFORMED` | The file itself cannot be used                              |
| 404    | `NOT_FOUND`                                                       | Unknown route                                               |
| 500    | `INTERNAL_ERROR`                                                  | Unexpected error                                            |
