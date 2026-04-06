/**
 * 默认导入测试用例
 * 测试 sculp-js 的默认导出功能
 */

// 测试完整库的默认导入
import sculp from '../src/index';

// 测试核心库的默认导入
import coreSculp from '../src/core-index';

describe('默认导入测试 - 完整库', () => {
  test('默认导出对象应该存在', () => {
    expect(sculp).toBeDefined();
    expect(typeof sculp).toBe('object');
  });

  test('默认导出应该包含 type 模块的函数', () => {
    expect(sculp.isString).toBeDefined();
    expect(sculp.isNumber).toBeDefined();
    expect(sculp.isArray).toBeDefined();
    expect(sculp.isObject).toBeDefined();
    expect(sculp.isFunction).toBeDefined();
    expect(sculp.isNull).toBeDefined();
    expect(sculp.isUndefined).toBeDefined();
    expect(sculp.isEmpty).toBeDefined();
  });

  test('默认导出应该包含 string 模块的函数', () => {
    expect(sculp.stringCamelCase).toBeDefined();
    expect(sculp.stringKebabCase).toBeDefined();
    expect(sculp.stringFormat).toBeDefined();
    expect(sculp.stringAssign).toBeDefined();
    expect(sculp.stringFill).toBeDefined();
    expect(sculp.stringEscapeHtml).toBeDefined();
  });

  test('默认导出应该包含 date 模块的函数', () => {
    expect(sculp.formatDate).toBeDefined();
    expect(sculp.dateParse).toBeDefined();
    expect(sculp.adjustDate).toBeDefined();
    expect(sculp.dateToStart).toBeDefined();
    expect(sculp.dateToEnd).toBeDefined();
  });

  test('默认导出应该包含 array 模块的函数', () => {
    expect(sculp.arrayEach).toBeDefined();
    expect(sculp.arrayRemove).toBeDefined();
    expect(sculp.arrayInsertBefore).toBeDefined();
    expect(sculp.diffArray).toBeDefined();
  });

  test('默认导出应该包含 object 模块的函数', () => {
    expect(sculp.objectAssign).toBeDefined();
    expect(sculp.objectGet).toBeDefined();
    expect(sculp.objectPick).toBeDefined();
    expect(sculp.objectOmit).toBeDefined();
    expect(sculp.objectFill).toBeDefined();
  });

  test('默认导出应该包含 math 模块的函数', () => {
    expect(sculp.add).toBeDefined();
    expect(sculp.subtract).toBeDefined();
    expect(sculp.multiply).toBeDefined();
    expect(sculp.divide).toBeDefined();
    expect(sculp.strip).toBeDefined();
  });

  test('默认导出应该包含 number 模块的函数', () => {
    expect(sculp.formatMoney).toBeDefined();
    expect(sculp.numberAbbr).toBeDefined();
    expect(sculp.humanFileSize).toBeDefined();
    expect(sculp.numberToHex).toBeDefined();
  });

  test('默认导出应该包含 url 模块的函数', () => {
    expect(sculp.urlParse).toBeDefined();
    expect(sculp.urlStringify).toBeDefined();
    expect(sculp.urlSetParams).toBeDefined();
    expect(sculp.urlDelParams).toBeDefined();
  });

  test('默认导出应该包含 qs 模块的函数', () => {
    expect(sculp.qsParse).toBeDefined();
    expect(sculp.qsStringify).toBeDefined();
  });

  test('默认导出应该包含 path 模块的函数', () => {
    expect(sculp.pathJoin).toBeDefined();
    expect(sculp.pathNormalize).toBeDefined();
  });

  test('默认导出应该包含 async 模块的函数', () => {
    expect(sculp.asyncMap).toBeDefined();
    expect(sculp.safeAwait).toBeDefined();
    expect(sculp.wait).toBeDefined();
  });

  test('默认导出应该包含 func 模块的函数', () => {
    expect(sculp.debounce).toBeDefined();
    expect(sculp.throttle).toBeDefined();
    expect(sculp.once).toBeDefined();
  });

  test('默认导出应该包含 random 模块的函数', () => {
    expect(sculp.randomString).toBeDefined();
    expect(sculp.randomNumber).toBeDefined();
    expect(sculp.randomUuid).toBeDefined();
  });

  test('默认导出应该包含 validator 模块的函数', () => {
    expect(sculp.isEmail).toBeDefined();
    expect(sculp.isPhone).toBeDefined();
    expect(sculp.isUrl).toBeDefined();
    expect(sculp.isIdNo).toBeDefined();
  });

  test('默认导出应该包含 tree 模块的函数', () => {
    expect(sculp.formatTree).toBeDefined();
    expect(sculp.flatTree).toBeDefined();
    expect(sculp.findDeep).toBeDefined();
    expect(sculp.filterDeep).toBeDefined();
  });

  test('默认导出应该包含 base64 模块的函数', () => {
    expect(sculp.b64encode).toBeDefined();
    expect(sculp.b64decode).toBeDefined();
    expect(sculp.weBtoa).toBeDefined();
    expect(sculp.weAtob).toBeDefined();
  });

  test('默认导出应该包含 cloneDeep 模块的函数', () => {
    expect(sculp.cloneDeep).toBeDefined();
  });

  test('默认导出应该包含 isEqual 模块的函数', () => {
    expect(sculp.isEqual).toBeDefined();
  });

  test('默认导出应该包含 dom 模块的函数', () => {
    expect(sculp.addClass).toBeDefined();
    expect(sculp.removeClass).toBeDefined();
    expect(sculp.hasClass).toBeDefined();
    expect(sculp.getStyle).toBeDefined();
    expect(sculp.setStyle).toBeDefined();
  });

  test('默认导出应该包含 cookie 模块的函数', () => {
    expect(sculp.cookieSet).toBeDefined();
    expect(sculp.cookieGet).toBeDefined();
    expect(sculp.cookieDel).toBeDefined();
  });

  test('默认导出应该包含 download 模块的函数', () => {
    expect(sculp.downloadBlob).toBeDefined();
    expect(sculp.downloadData).toBeDefined();
    expect(sculp.downloadURL).toBeDefined();
  });

  test('默认导出应该包含 file 模块的函数', () => {
    expect(sculp.chooseLocalFile).toBeDefined();
    expect(sculp.compressImg).toBeDefined();
  });

  test('默认导出应该包含 unique 模块的函数', () => {
    expect(sculp.uniqueString).toBeDefined();
    expect(sculp.uniqueNumber).toBeDefined();
  });

  test('默认导出应该包含 variable 模块的函数', () => {
    expect(sculp.escapeRegExp).toBeDefined();
    expect(sculp.parseVarFromString).toBeDefined();
    expect(sculp.replaceVarFromString).toBeDefined();
  });

  test('默认导出应该包含 unicodeToolkit 模块', () => {
    expect(sculp.UnicodeToolkit).toBeDefined();
  });

  test('默认导出的函数应该可以正常工作', () => {
    expect(sculp.isString('hello')).toBe(true);
    expect(sculp.isNumber(123)).toBe(true);
    expect(sculp.isArray([1, 2, 3])).toBe(true);
    expect(sculp.stringCamelCase('hello-world')).toBe('helloWorld');
    expect(sculp.add(0.1, 0.2)).toBe(0.3);
  });
});

describe('默认导入测试 - 核心库', () => {
  test('核心库默认导出对象应该存在', () => {
    expect(coreSculp).toBeDefined();
    expect(typeof coreSculp).toBe('object');
  });

  test('核心库默认导出应该包含 type 模块的函数', () => {
    expect(coreSculp.isString).toBeDefined();
    expect(coreSculp.isNumber).toBeDefined();
    expect(coreSculp.isArray).toBeDefined();
  });

  test('核心库默认导出应该包含 string 模块的函数', () => {
    expect(coreSculp.stringCamelCase).toBeDefined();
    expect(coreSculp.stringFormat).toBeDefined();
  });

  test('核心库默认导出应该包含 date 模块的函数', () => {
    expect(coreSculp.formatDate).toBeDefined();
  });

  test('核心库默认导出应该包含 array 模块的函数', () => {
    expect(coreSculp.arrayEach).toBeDefined();
  });

  test('核心库默认导出应该包含 object 模块的函数', () => {
    expect(coreSculp.objectAssign).toBeDefined();
  });

  test('核心库默认导出应该包含 math 模块的函数', () => {
    expect(coreSculp.add).toBeDefined();
  });

  test('核心库默认导出应该包含 number 模块的函数', () => {
    expect(coreSculp.formatMoney).toBeDefined();
  });

  test('核心库默认导出应该包含 path 模块的函数', () => {
    expect(coreSculp.pathJoin).toBeDefined();
  });

  test('核心库默认导出应该包含 async 模块的函数', () => {
    expect(coreSculp.asyncMap).toBeDefined();
  });

  test('核心库默认导出应该包含 func 模块的函数', () => {
    expect(coreSculp.debounce).toBeDefined();
  });

  test('核心库默认导出应该包含 random 模块的函数', () => {
    expect(coreSculp.randomString).toBeDefined();
  });

  test('核心库默认导出应该包含 validator 模块的函数', () => {
    expect(coreSculp.isEmail).toBeDefined();
  });

  test('核心库默认导出应该包含 tree 模块的函数', () => {
    expect(coreSculp.formatTree).toBeDefined();
  });

  test('核心库默认导出应该包含 base64 模块的函数', () => {
    expect(coreSculp.b64encode).toBeDefined();
  });

  test('核心库默认导出应该包含 unique 模块的函数', () => {
    expect(coreSculp.uniqueString).toBeDefined();
  });

  test('核心库默认导出应该包含 variable 模块的函数', () => {
    expect(coreSculp.escapeRegExp).toBeDefined();
  });

  test('核心库默认导出的函数应该可以正常工作', () => {
    expect(coreSculp.isString('hello')).toBe(true);
    expect(coreSculp.stringCamelCase('hello-world')).toBe('helloWorld');
    expect(coreSculp.add(0.1, 0.2)).toBe(0.3);
  });

  test('核心库默认导出不应该包含浏览器相关模块', () => {
    // 核心库不应该包含这些浏览器/Node 环境相关的模块
    expect(coreSculp.cookieSet).toBeUndefined();
    expect(coreSculp.addClass).toBeUndefined();
    expect(coreSculp.downloadBlob).toBeUndefined();
    expect(coreSculp.chooseLocalFile).toBeUndefined();
    expect(coreSculp.genCanvasWM).toBeUndefined();
    expect(coreSculp.cloneDeep).toBeUndefined();
    expect(coreSculp.isEqual).toBeUndefined();
    expect(coreSculp.UnicodeToolkit).toBeUndefined();
  });
});
