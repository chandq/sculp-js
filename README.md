[![Node.js CI](https://github.com/chandq/sculp-js/actions/workflows/node.js.yml/badge.svg)](https://github.com/chandq/sculp-js/actions/workflows/node.js.yml)
[![sculp-js](https://img.shields.io/github/package-json/v/chandq/sculp-js?style=flat-square)](https://github.com/chandq/sculp-js)
[![node](https://img.shields.io/badge/node-v12.0.0-blue)](https://nodejs.org/download/release/v12.0.0/)
[![node](https://img.shields.io/badge/language-typescript-orange.svg)](https://nodejs.org/download/release/v12.0.0/)
[![license:MIT](https://img.shields.io/npm/l/vue.svg?sanitize=true)](https://github.com/chandq/sculp-js/blob/main/LICENSE.md)
[![Downloads:?](https://img.shields.io/npm/dm/sculp-js.svg?sanitize=true)](https://npmcharts.com/compare/sculp-js?minimal=true)

# sculp-js

> TS + Rollup, 原生实现，不依赖任何第三方库，输出 esm、cjs、umd三种模块方式的产物

js 工具函数库, 包含类型判断模块：type, 数据处理模块：`array`、`object`、`string`、`number`，功能性模块：下载`download`、复制`clipboard`、`cookie`、日期`date`、qs、水印`watermark`, 文件处理模块：`file`，自定义悬浮提示模块： `tooltip`, dom处理模块：`dom`;

- Array

  - arrayLike 判断类数组
  - arrayEach 可中断的数组遍历， 支持倒序
  - arrayEachAsync 异步遍历数组，可中断，支持倒序
  - arrayInsertBefore 改变数组元素位置
  - arrayRemove 数组删除指定元素
  - deepTraversal 深度优先遍历函数, 支持continue、break，可定制id、children
  - getTreeIds 在树中找到 id 为某个值的节点，并返回上游的所有父级节点

## [API文档详情](https://chandq.github.io/sculp-js/)
