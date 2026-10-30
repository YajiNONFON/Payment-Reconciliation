import path from 'node:path';
import swaggerJsdoc from 'swagger-jsdoc';

// Works from src/ (ts) and dist/ (js). Forward slashes keep the glob valid on Windows.
const routeFiles = path
  .join(__dirname, '..', 'modules', '**', '*.routes.{ts,js}')
  .split(path.sep)
  .join('/');

export function buildOpenApiSpec(): object {
  return swaggerJsdoc({
    definition: {
      openapi: '3.0.3',
      info: {
        title: 'Payment Reconciliation API',
        version: '0.1.0',
        description:
          'Import invoices and payments from CSV files, then reconcile them. Amounts are integer US cents.',
      },
      components: {
        schemas: {
          ImportResult: {
            type: 'object',
            properties: { imported: { type: 'integer', example: 30 } },
          },
          Error: {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string', example: 'CSV_VALIDATION_FAILED' },
                  message: { type: 'string' },
                  details: {
                    type: 'object',
                    properties: {
                      errorCount: { type: 'integer' },
                      errors: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            line: { type: 'integer', example: 4 },
                            field: { type: 'string', example: 'amount' },
                            message: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          Error: {
            description: 'Error',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Error' } },
            },
          },
        },
      },
    },
    apis: [routeFiles],
  });
}
