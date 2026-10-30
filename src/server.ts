import { createApp } from './app';
import { env } from './config/env';
import { disconnectPrisma } from './lib/prisma';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT} (docs: /docs)`);
});

function shutdown(): void {
  server.close(() => {
    void disconnectPrisma().finally(() => process.exit(0));
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
