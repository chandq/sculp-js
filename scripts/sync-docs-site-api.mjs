import fs from 'node:fs/promises';
import path from 'node:path';

const repoRoot = process.cwd();
const sourceDir = path.join(repoRoot, 'docs', 'markdown');
const targetDir = path.join(repoRoot, 'docs-site', 'api');

async function ensureEmptyDir(dir) {
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
}

async function copyDir(from, to) {
  const entries = await fs.readdir(from, { withFileTypes: true });
  for (const ent of entries) {
    const src = path.join(from, ent.name);
    const dst = path.join(to, ent.name);
    if (ent.isDirectory()) {
      await fs.mkdir(dst, { recursive: true });
      await copyDir(src, dst);
    } else if (ent.isFile()) {
      // API Documenter 输出里会出现 `<!-- -->` 这种“分隔注释”，在 VitePress 中会进入 Vue 模板编译，
      // 某些场景会触发 Vue 编译错误（例如 Duplicate attribute）。
      // 这里在同步时统一清洗掉，避免点击 API 页面时报错。
      if (ent.name.endsWith('.md')) {
        const raw = await fs.readFile(src, 'utf8');
        const cleaned = raw
          // normalize newlines to LF
          .replace(/\r\n/g, '\n')
          // remove API Documenter separator comments
          .replace(/<!-- -->/g, '');
        await fs.writeFile(dst, cleaned, 'utf8');
      } else {
        await fs.copyFile(src, dst);
      }
    }
  }
}

async function main() {
  const srcStat = await fs.stat(sourceDir).catch(() => null);
  if (!srcStat || !srcStat.isDirectory()) {
    throw new Error(`Source API markdown folder not found: ${sourceDir}`);
  }

  await ensureEmptyDir(targetDir);
  await copyDir(sourceDir, targetDir);

  const apiIndexPath = path.join(targetDir, 'index.md');
  const apiIndex = await fs.readFile(apiIndexPath, 'utf8').catch(() => null);
  if (apiIndex) {
    const banner =
      '\n> 说明：本目录由 API Extractor + API Documenter 自动生成；如需从站点首页开始阅读，请访问 [sculp-js 文档首页](/)。\n';
    if (!apiIndex.includes('sculp-js 文档首页')) {
      await fs.writeFile(apiIndexPath, apiIndex + banner, 'utf8');
    }
  }

  const apiDirIndexPath = path.join(targetDir, 'README.md');
  await fs.writeFile(
    apiDirIndexPath,
    '# API Reference\n\n- [目录（API Documenter 生成）](./index.md)\n- [sculp-js（总览）](./sculp-js.md)\n',
    'utf8'
  );

  console.log(`Synced API markdown: ${path.relative(repoRoot, sourceDir)} -> ${path.relative(repoRoot, targetDir)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

