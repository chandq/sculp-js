import { resolve } from 'node:path';
import { preview } from 'vitepress';

const root = resolve('docs-site');

// VitePress API: preview(root, config)
const server = await preview(root, { logLevel: 'info' });

const info = server.config.logger.info;
info(`\nVitePress preview server running at:\n  http://localhost:${server.config.server.port ?? 4173}\n`);

