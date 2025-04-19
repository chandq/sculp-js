[![Node.js CI](https://github.com/chandq/sculp-js/actions/workflows/build.yml/badge.svg)](https://github.com/chandq/sculp-js/actions/workflows/build.yml)
[![sculp-js](https://img.shields.io/github/package-json/v/chandq/sculp-js?style=flat-square)](https://github.com/chandq/sculp-js)
[![node](https://img.shields.io/badge/language-typescript-orange.svg)](https://nodejs.org/download/release/v12.0.0/)
[![license:MIT](https://img.shields.io/npm/l/vue.svg?sanitize=true)](https://github.com/chandq/sculp-js/blob/main/LICENSE.md)
[![Downloads:?](https://img.shields.io/npm/dm/sculp-js.svg?sanitize=true)](https://npmcharts.com/compare/sculp-js?minimal=true)
[![codecov](https://codecov.io/gh/chandq/sculp-js/graph/badge.svg?token=VZ6TERPGI9)](https://codecov.io/gh/chandq/sculp-js)

# sculp-js

[API Doc](https://chandq.github.io/sculp-js/)

> TS + Rollup, native implementation, without relying on any third-party libraries, outputs products of three module modes: ESM, CJS, and UMD. sculp-js only used to Web environment, @sculp/core can be used to Web、Node.js、Mini Program.

## Quickstart

- Via CDN: `<script src="https://unpkg.com/sculp-js"></script>`
- Via npm:

  ```js
  npm i sculp-js
  ```

## Features

- Type

  - isString
  - isBoolean
  - isNumber
  - isUndefined
  - isNull
  - isNullish
  - isPrimitive
  - isFunction
  - isObject
  - isArray
  - typeIs
  - isJsonString
  - isEmpty

- encode/decode

  - weAtob
  - weBtoa

- Array

  - arrayLike 判断类数组
  - arrayEachAsync 异步遍历数组，可中断，支持倒序

- Tree

  - forEachDeep 高性能的深度优先遍历函数, 支持continue、break，可定制id、children
  - mapDeep 高性能的深度优先遍历的Map函数, 支持continue、break，可定制id、children
  - searchTreeById 在树中找到 id 为某个值的节点，并返回上游的所有父级节点
  - formatTree 高性能的数组转树函数
  - flatTree 树转数组
  - fuzzySearchTree 模糊搜索函数，返回包含搜索字符的节点及其祖先节点的树

- Object

  - isPlainObject
  - objectHas
  - objectAssign
  - objectEach
  - objectEachAsync
  - objectGet
  - cloneDeep
  - isEqual

- Number

  - formatNumber

- String

  - stringCamelCase
  - stringKebabCase
  - parseQueryParams

- Unique

  - uniqueString
  - uniqueNumber

- Date

  - formatDate
  - dateToStart
  - dateToEnd
  - calculateDate
  - calculateDateTime

- Download (web)

  - downloadURL
  - downloadHref
  - downloadBlob
  - downloadData

- File (web)

  - chooseLocalFile
  - compressImg 压缩图片

- Dom （web）

  - hasClass
  - addClass
  - removeClass
  - setStyle
  - getStyle
  - getComputedCssVal
  - getStrWidthPx

- Watermark (web)

  - genCanvasWM

- Clipboard (web)
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
