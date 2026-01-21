import { resolve } from 'node:path';
import { build, serve } from 'vitepress';

const root = resolve('docs-site');

// 先构建文档
await build(root, {});

// 然后启动预览服务器
const server = await serve({
  root,
  port: 5173,
  host: true,
  open: false,
  logLevel: 'info'
});

const info = server.config.logger.info;
info(`\nVitePress preview server running at:\n  http://localhost:${server.config.server.port ?? 5173}\n`);

await server.listen();