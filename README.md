<div align="center">

# sculp-js

**A Modern JavaScript Utility Library for Web**

[![Node.js CI](https://github.com/chandq/sculp-js/actions/workflows/node.js.yml/badge.svg)](https://github.com/chandq/sculp-js/actions/workflows/node.js.yml)
[![sculp-js](https://img.shields.io/github/package-json/v/chandq/sculp-js?style=flat-square)](https://www.npmjs.com/package/sculp-js)
[![license:MIT](https://img.shields.io/npm/l/vue.svg?sanitize=true)](https://github.com/chandq/sculp-js/blob/main/LICENSE.md)
[![codecov](https://codecov.io/gh/chandq/sculp-js/graph/badge.svg?token=VZ6TERPGI9)](https://codecov.io/gh/chandq/sculp-js)

</div>

<br/>

> A lightweight utility library written in TypeScript with zero dependencies, supporting ESM, CJS, and UMD formats.

**[API Documentation](https://chandq.github.io/sculp-js/)** • **[Getting Started](#usage)** • **[Features](#features)**

## ✨ Features

- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **Zero Dependencies**: Pure native implementation, no external libraries
- **Tree Shaking**: Supports selective imports for smaller bundle sizes
- **Multi-Format**: ESM, CJS, and UMD builds available
- **Web Focused**: Optimized for modern web environments

### Core Utilities

<details>
<summary><strong>Type Checking</strong></summary>

- `isString`, `isNumber`, `isBoolean`, `isFunction`, `isObject`, `isArray`
- `isDate`, `isRegExp`, `isUndefined`, `isNull`, `isError`, `isNaN`
- `isPrimitive`, `isSymbol`, `isBigInt`, `isPlainObject`
- `isEmpty`, `isNodeList`, `isValidDate`, `typeIs`

</details>

<details>
<summary><strong>Data Structures</strong></summary>

- **Array**: `arrayEach`, `arrayEachAsync`, `arrayInsertBefore`, `arrayRemove`
- **Tree**: `forEachDeep`, `mapDeep`, `findDeep`, `filterDeep`, `searchTreeById`, `flatTree`, `fuzzySearchTree`
- **Object**: `objectAssign`, `objectGet`, `objectHas`, `cloneDeep`, `objectPick`, `objectOmit`

</details>

<details>
<summary><strong>Web APIs</strong></summary>

- **DOM**: `addClass`, `hasClass`, `removeClass`, `getStyle`, `setStyle`
- **File**: `chooseLocalFile`, `compressImg`
- **Clipboard**: `copyText`, `fallbackCopyText`
- **Download**: `downloadBlob`, `downloadURL`, `downloadData`
- **Watermark**: `genCanvasWM`

</details>

<details>
<summary><strong>Encoding & Validation</strong></summary>

- **Encode/Decode**: `weBtoa`, `weAtob`, `b64encode`, `b64decode`
- **Validation**: `isEmail`, `isPhone`, `isUrl`, `isIDNO`, `isIPv4`, `isIPv6`

</details>

<details>
<summary><strong>Additional Utils</strong></summary>

- **Date**: `formatDate`, `calculateDate`, `dateToStart`, `dateToEnd`
- **String**: `stringCamelCase`, `stringKebabCase`, `parseQueryParams`, `stringEscapeHTML`
- **Math**: `add`, `subtract`, `multiply`, `divide`, `numberAbbr`
- **Functional**: `debounce`, `throttle`, `once`, `wait`

</details>

## 🚀 Installation

### npm

```bash
npm install sculp-js
```

### CDN

```html
<script src="https://unpkg.com/sculp-js"></script>
```

## 💡 Usage

```js
import { forEachDeep, cloneDeep } from 'sculp-js';

// Deep traversal of tree structures
const tree = [
  {
    id: 1,
    name: 'Parent 1',
    children: [
      { id: 11, name: 'Child 1' },
      { id: 12, name: 'Child 2', children: [{ id: 121, name: 'Grandchild 1' }] }
    ]
  },
  { id: 2, name: 'Parent 2' }
];

const names = [];
forEachDeep(tree, item => {
  names.push(item.name);
});
// names = ['Parent 1', 'Child 1', 'Child 2', 'Grandchild 1', 'Parent 2']

// Deep cloning of objects
const original = { a: 1, b: { c: 2 } };
const cloned = cloneDeep(original);
```

## 📦 Module Formats

```js
// ES Modules (recommended)
import { cloneDeep } from 'sculp-js';

// Individual module imports
import cloneDeep from 'sculp-js/cloneDeep';

// CommonJS
const { cloneDeep } = require('sculp-js');
```

## 📄 License

MIT License © 2023-present, [chandq](https://github.com/chandq)
