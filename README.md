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

### Named Imports (Recommended)

```js
// ES Modules - Named imports (tree-shaking friendly)
import { cloneDeep, forEachDeep } from 'sculp-js';

// CommonJS - Named imports
const { cloneDeep, forEachDeep } = require('sculp-js');
```

### Default Import (Full Library)

```js
// ES Modules - Default import
import sculp from 'sculp-js';
const { cloneDeep, forEachDeep } = sculp;

// CommonJS - Default import
const sculp = require('sculp-js');
const { cloneDeep, forEachDeep } = sculp;
```

### Module-Specific Imports

Import specific modules for better tree-shaking and smaller bundle sizes:

```js
// ES Modules - Import specific modules
import array from 'sculp-js/array';
import string from 'sculp-js/string';
import type from 'sculp-js/type';
import date from 'sculp-js/date';
import object from 'sculp-js/object';
import math from 'sculp-js/math';
import validator from 'sculp-js/validator';
// ... and more

// CommonJS - Import specific modules
const array = require('sculp-js/array');
const string = require('sculp-js/string');
const type = require('sculp-js/type');

// Usage examples
import array from 'sculp-js/array';
array.arrayEach([1, 2, 3], val => console.log(val));

import string from 'sculp-js/string';
const camelCase = string.stringCamelCase('hello-world'); // 'helloWorld'

import validator from 'sculp-js/validator';
if (validator.isEmail('test@example.com')) {
  console.log('Valid email');
}
```

### Available Modules

All modules support both named and default exports:

- `sculp-js/array` - Array utilities
- `sculp-js/string` - String manipulation
- `sculp-js/type` - Type checking
- `sculp-js/date` - Date formatting
- `sculp-js/object` - Object utilities
- `sculp-js/math` - Math operations
- `sculp-js/number` - Number formatting
- `sculp-js/url` - URL parsing
- `sculp-js/qs` - Query string parsing
- `sculp-js/path` - Path utilities
- `sculp-js/async` - Async utilities
- `sculp-js/func` - Function utilities
- `sculp-js/random` - Random generators
- `sculp-js/validator` - Validation functions
- `sculp-js/tree` - Tree operations
- `sculp-js/base64` - Base64 encoding
- `sculp-js/unique` - Unique ID generators
- `sculp-js/variable` - Variable utilities
- `sculp-js/clipboard` - Clipboard operations
- `sculp-js/cookie` - Cookie management
- `sculp-js/dom` - DOM utilities
- `sculp-js/download` - Download helpers
- `sculp-js/file` - File utilities
- `sculp-js/watermark` - Watermark generation
- `sculp-js/tooltip` - Tooltip utilities
- `sculp-js/cloneDeep` - Deep cloning
- `sculp-js/isEqual` - Deep equality
- `sculp-js/unicodeToolkit` - Unicode utilities

## 📄 License

MIT License © 2023-present, [chandq](https://github.com/chandq)
