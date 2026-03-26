#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const modules = [
  { file: 'date.ts', exports: ['isValidDate', 'dateParse', 'dateToStart', 'dateToEnd', 'formatDate', 'calculateDate', 'calculateDateTime'] },
  { file: 'object.ts', exports: ['isPlainObject', 'objectEach', 'objectEachAsync', 'objectMap', 'objectPick', 'objectOmit', 'objectAssign', 'objectMerge', 'objectFill', 'objectGet'] },
  { file: 'math.ts', exports: ['add', 'subtract', 'multiply', 'divide', 'strip'] },
  { file: 'number.ts', exports: ['HEX_POOL', 'numberToHex', 'numberAbbr', 'humanFileSize', 'formatNumber', 'formatMoney'] },
  { file: 'url.ts', exports: ['urlParse', 'urlStringify', 'urlSetParams', 'urlDelParams'] },
  { file: 'qs.ts', exports: ['qsParse', 'qsStringify'] },
  { file: 'path.ts', exports: ['pathJoin', 'pathNormalize'] },
  { file: 'async.ts', exports: ['wait', 'asyncMap', 'safeAwait'] },
  { file: 'func.ts', exports: ['debounce', 'throttle', 'once', 'getGlobal', 'setGlobal'] },
  { file: 'random.ts', exports: ['STRING_POOL', 'randomNumber', 'randomString', 'randomUuid'] },
  { file: 'validator.ts', exports: ['EMAIL_REGEX', 'HTTP_URL_REGEX', 'IPV4_REGEX', 'IPV6_REGEX', 'PHONE_REGEX', 'URL_REGEX', 'isDigit', 'isEmail', 'isFloat', 'isIdNo', 'isInteger', 'isIpV4', 'isIpV6', 'isNumerical', 'isPhone', 'isUrl'] },
  { file: 'tree.ts', exports: ['forEachDeep', 'findDeep', 'filterDeep', 'mapDeep', 'searchTreeById', 'formatTree', 'flatTree', 'fuzzySearchTree'] },
  { file: 'base64.ts', exports: ['weBtoa', 'weAtob', 'b64decode', 'b64encode'] },
  { file: 'unique.ts', exports: ['UNIQUE_NUMBER_SAFE_LENGTH', 'uniqueNumber', 'uniqueString'] },
  { file: 'variable.ts', exports: ['escapeRegExp', 'executeInScope', 'parseVarFromString', 'replaceVarFromString', 'uniqueSymbol'] },
  { file: 'clipboard.ts', exports: ['copyText', 'fallbackCopyText'] },
  { file: 'cookie.ts', exports: ['cookieSet', 'cookieGet', 'cookieDel'] },
  { file: 'dom.ts', exports: ['hasClass', 'addClass', 'removeClass', 'setStyle', 'getStyle', 'getComputedCssVal', 'getStrWidthPx', 'select'] },
  { file: 'download.ts', exports: ['downloadURL', 'downloadHref', 'downloadBlob', 'crossOriginDownload', 'downloadData'] },
  { file: 'file.ts', exports: ['supportCanvas', 'chooseLocalFile', 'compressImg'] },
  { file: 'watermark.ts', exports: ['genCanvasWM'] },
  { file: 'tooltip.ts', exports: ['tooltipEvent'] },
  { file: 'cloneDeep.ts', exports: ['cloneDeep'] },
  { file: 'isEqual.ts', exports: ['isEqual'] },
  { file: 'unicodeToolkit.ts', exports: ['UnicodeToolkit'] }
];

const srcDir = path.join(__dirname, '../src');

modules.forEach(({ file, exports }) => {
  const filePath = path.join(srcDir, file);

  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${file}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  // 检查是否已经有默认导出
  if (content.includes('export default')) {
    console.log(`Skipping ${file} - already has default export`);
    return;
  }

  // 添加默认导出
  const defaultExport = `\nexport default {\n  ${exports.join(',\n  ')}\n};\n`;

  fs.writeFileSync(filePath, content + defaultExport, 'utf-8');
  console.log(`Added default export to ${file}`);
});

console.log('\nDone!');
