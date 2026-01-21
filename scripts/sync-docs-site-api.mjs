import fs from 'node:fs/promises';
import path from 'node:path';

const repoRoot = process.cwd();
const sourceDir = path.join(repoRoot, 'api-docs', 'markdown');
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
      // API Documenter 输出里会出现 `<!-- -->` 这种"分隔注释"，在 VitePress 中会进入 Vue 模板编译，
      // 某些场景会触发 Vue 编译错误（例如 Duplicate attribute）。
      // 这里在同步时统一清洗掉，避免点击 API 页面时报错。
      if (ent.name.endsWith('.md')) {
        const raw = await fs.readFile(src, 'utf8');

        // 分离代码块和非代码块内容
        const parts = splitByCodeBlocks(raw);

        // 处理非代码块内容
        const processedParts = parts.map(part => {
          if (part.isCodeBlock) {
            return part.content; // 保持代码块原样
          } else {
            // 处理非代码块内容
            return processNonCodeContent(part.content);
          }
        });

        const cleaned = processedParts.join('');

        await fs.writeFile(dst, cleaned, 'utf8');
      } else {
        await fs.copyFile(src, dst);
      }
    }
  }
}

// 将内容分割为代码块和非代码块部分
function splitByCodeBlocks(content) {
  const regex = /(```[\s\S]*?```|~~~[\s\S]*?~~~)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    // 添加非代码块部分
    if (match.index > lastIndex) {
      parts.push({ content: content.substring(lastIndex, match.index), isCodeBlock: false });
    }

    // 添加代码块部分
    parts.push({ content: match[0], isCodeBlock: true });

    lastIndex = regex.lastIndex;
  }

  // 添加最后的非代码块部分（如果存在）
  if (lastIndex < content.length) {
    parts.push({ content: content.substring(lastIndex), isCodeBlock: false });
  }

  return parts;
}

// 处理非代码块内容
function processNonCodeContent(content) {
  return (
    content
      // normalize newlines to LF
      .replace(/\r\n/g, '\n')
      // remove API Documenter separator comments
      .replace(/<!-- -->/g, '')
      // 处理 Markdown 链接后跟随的泛型语法，如 [SomeType](link.md)&lt;T&gt;
      .replace(/\[([^\]]+)\]\(([^)]+)\)&lt;([A-Za-z0-9_,\s]+)&gt;/g, (match, typeName, link, generics) => {
        return `[${typeName}](${link})\`${generics}\``;
      })
      // 处理数组语法
      .replace(/([A-Za-z0-9_]+)\[\]/g, (match, type) => {
        return `\`${type}[]\``;
      })
      // 处理普通泛型语法（在非代码块中），将其用反引号包围
      .replace(/([a-zA-Z0-9_]+)&lt;([A-Za-z0-9_,\s]+)&gt;/g, (match, type, generics) => {
        return `\`${type}<${generics}>\``;
      })
      // 处理普通尖括号形式的泛型语法（非代码块中）
      .replace(/([a-zA-Z0-9_]+)&lt;([A-Za-z0-9_,\s]+)&gt;/g, (match, type, generics) => {
        return `\`${type}<${generics}>\``;
      })
      // 再次处理剩余的尖括号形式的泛型语法（例如 DiffResult<T>）
      .replace(/([a-zA-Z0-9_]+)<([A-Za-z0-9_,\s]+)>/g, (match, type, generics) => {
        return `\`${type}<${generics}>\``;
      })
      // 处理普通花括号，但不影响对象字面量的显示
      .replace(/\{/g, '\\{') // 转义单独的左花括号
      .replace(/\}/g, '\\}') // 转义单独的右花括号
      // 清理可能导致解析错误的特殊标记，如 {*}
      .replace(/\{\s*\\\*\s*\}/g, '') // 移除转义后的 {\*} 标记
      .replace(/\{\s*\*\s*\}/g, '') // 移除孤立的 {*} 标记
      // 处理其他潜在的特殊标记
      .replace(/\{\s*\/?\s*[a-zA-Z]+\s*\}/g, '')
  ); // 移除其他类似的标记如 {/someTag}
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

main().catch(err => {
  console.error(err);
  process.exit(1);
});
