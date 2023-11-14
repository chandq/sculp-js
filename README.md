[![Node.js CI](https://github.com/chandq/sculp-js/actions/workflows/node.js.yml/badge.svg)](https://github.com/chandq/sculp-js/actions/workflows/node.js.yml)
[![sculp-js](https://img.shields.io/github/package-json/v/chandq/sculp-js?style=flat-square)](https://github.com/chandq/sculp-js)
[![node](https://img.shields.io/badge/node-v12.0.0-blue)](https://nodejs.org/download/release/v12.0.0/)
[![node](https://img.shields.io/badge/language-typescript-orange.svg)](https://nodejs.org/download/release/v12.0.0/)
[![license:MIT](https://img.shields.io/npm/l/vue.svg?sanitize=true)](https://github.com/chandq/sculp-js/blob/main/LICENSE.md)
[![Downloads:?](https://img.shields.io/npm/dm/sculp-js.svg?sanitize=true)](https://npmcharts.com/compare/sculp-js?minimal=true)

# sculp-js

[API文档](https://chandq.github.io/sculp-js/)

> TS + Rollup, native implementation, without relying on any third-party libraries, outputs products of three module modes: ESM, CJS, and UMD

## Features

- Type

  - isString
  - isBoolean
  - isNumber
  - isUndefined
  - isNull
  - isPrimitive
  - isObject
  - typeIs

- Array

  - arrayLike 判断类数组
  - arrayEachAsync 异步遍历数组，可中断，支持倒序
  - forEachDeep 深度优先遍历函数, 支持continue、break，可定制id、children
  - searchTreeById 在树中找到 id 为某个值的节点，并返回上游的所有父级节点
  - buildTree 根据 id 与 parentId 从对象数组中构建对应的树

- Object

  - isPlainObject
  - objectHas
  - objectAssign 合并
  - objectEach
  - objectEachAsync
  - objectGet

- Number

  - formatNumber

- String

  - stringCamelCase
  - stringKebabCase
  - getStrWidthPx

- Unique

  - uniqueString
  - uniqueNumber

- Date

  - formatDate
  - dateToStart
  - dateToEnd
  - calculateDate
  - calculateDateTime

- Download

  - downloadURL
  - downloadHref
  - downloadBlob
  - downloadData

- File

  - chooseLocalFile

- Dom

  - hasClass
  - addClass
  - removeClass
  - setStyle
  - getStyle
  - getComputedCssVal

- Watermark

  - genCanvasWM

- Clipboard
  - copyText

## Install

```js
npm i sculp-js
```

## Usage

```js
import { forEachDeep } from 'sculp-js';

const tree = [
  { id: 1, name: 'row1' },
  {
    id: 2,
    name: 'row2',
    children: [{ id: 21, name: 'row2-1' }]
  },
  { id: 3, name: 'row3' }
];

const arr = [];
forEachDeep(tree, ({ id, name }) => {
  arr.push(name);
});
// arr will be: ['row1', 'row2', 'row2-1', 'row3'];
```
