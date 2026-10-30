import express, { type Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { buildOpenApiSpec } from './config/swagger';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { apiRouter } from './routes';

export function createApp(): Express {
  const app = express();
  app.disable('x-powered-by');

  const spec = buildOpenApiSpec();

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.get('/docs.json', (_req, res) => {
    res.json(spec);
  });
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));
  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
