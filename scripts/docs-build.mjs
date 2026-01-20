import { resolve } from 'node:path';
import { build } from 'vitepress';
import './sync-docs-site-api.mjs';

const root = resolve('docs-site');

// VitePress API: build(root, config)
await build(root, {});

console.log('VitePress build finished. Output: docs-site/.vitepress/dist');

