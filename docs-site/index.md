# sculp-js

现代 JavaScript/TypeScript 实用工具库（偏 Web 环境），提供类型判断、字符串/数组/对象处理、树结构遍历、URL/QueryString、下载/DOM、随机数、日期等高频能力。

## 快速开始

### 安装

```bash
npm i sculp-js
```

### 使用

```ts
import { forEachDeep } from 'sculp-js';

const tree = [
  { id: 1, name: 'row1' },
  { id: 2, name: 'row2', children: [{ id: 21, name: 'row2-1' }] },
  { id: 3, name: 'row3' }
];

const arr: string[] = [];
forEachDeep(tree, ({ name }) => arr.push(name));
```

## 文档入口

- [API Reference（自动生成）](/api/index)
- [指南：开始使用](/guide/getting-started)
