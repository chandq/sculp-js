import { resolve } from 'node:path';
import { createServer } from 'vitepress';
import './sync-docs-site-api.mjs';

const root = resolve('docs-site');

// VitePress API: createServer(root, config)
const server = await createServer(root, {
  logLevel: 'info'
});

await server.listen();

const info = server.config.logger.info;
info(`\nVitePress dev server running at:\n  http://localhost:${server.config.server.port ?? 5173}\n`);

