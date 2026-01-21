import { resolve } from 'node:path';
import { build } from 'vitepress';

const root = resolve('docs-site');

// VitePress API: build(root, config)
await build(root, {
  // 不忽略死链接，让构建失败
  ignoreDeadLinks: false

  // Vite 配置，增加日志输出
  // vite: {
  //   logLevel: 'info'
  // }
});

console.log('VitePress build finished. Output: docs-site/.vitepress/dist');
