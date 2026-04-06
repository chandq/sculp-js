/**
 * 按模块默认导入测试用例
 * 测试各个模块的默认导入功能
 */

// 测试各个模块的默认导入
import array from '../src/array';
import string from '../src/string';
import type from '../src/type';
import date from '../src/date';
import object from '../src/object';
import math from '../src/math';
import number from '../src/number';
import url from '../src/url';
import qs from '../src/qs';
import path from '../src/path';
import async from '../src/async';
import func from '../src/func';
import random from '../src/random';
import validator from '../src/validator';
import tree from '../src/tree';
import base64 from '../src/base64';
import unique from '../src/unique';
import variable from '../src/variable';
import clipboard from '../src/clipboard';
import cookie from '../src/cookie';
import dom from '../src/dom';
import download from '../src/download';
import file from '../src/file';
import watermark from '../src/watermark';
import tooltip from '../src/tooltip';
import cloneDeep from '../src/cloneDeep';
import isEqual from '../src/isEqual';
import unicodeToolkit from '../src/unicodeToolkit';

describe('按模块默认导入测试', () => {
  describe('array 模块默认导入', () => {
    test('默认导出应该存在', () => {
      expect(array).toBeDefined();
      expect(typeof array).toBe('object');
    });

    test('应该包含所有导出的函数', () => {
      expect(array.arrayEach).toBeDefined();
      expect(array.arrayEachAsync).toBeDefined();
      expect(array.arrayInsertBefore).toBeDefined();
      expect(array.arrayRemove).toBeDefined();
      expect(array.diffArray).toBeDefined();
    });

    test('函数应该可以正常工作', () => {
      const arr = [1, 2, 3, 4, 5];
      let sum = 0;
      array.arrayEach(arr, val => {
        sum += val;
      });
      expect(sum).toBe(15);
    });
  });

  describe('string 模块默认导入', () => {
    test('默认导出应该存在', () => {
      expect(string).toBeDefined();
      expect(typeof string).toBe('object');
    });

    test('应该包含所有导出的函数', () => {
      expect(string.stringCamelCase).toBeDefined();
      expect(string.stringKebabCase).toBeDefined();
      expect(string.stringFormat).toBeDefined();
      expect(string.stringAssign).toBeDefined();
      expect(string.stringEscapeHtml).toBeDefined();
      expect(string.stringFill).toBeDefined();
      expect(string.parseQueryParams).toBeDefined();
      expect(string.STRING_ARABIC_NUMERALS).toBeDefined();
      expect(string.STRING_LOWERCASE_ALPHA).toBeDefined();
      expect(string.STRING_UPPERCASE_ALPHA).toBeDefined();
    });

    test('函数应该可以正常工作', () => {
      expect(string.stringCamelCase('hello-world')).toBe('helloWorld');
      expect(string.stringKebabCase('helloWorld')).toBe('hello-world');
      expect(string.stringFormat('My name is %s.', 'zhangsan')).toBe('My name is zhangsan.');
    });
  });

  describe('type 模块默认导入', () => {
    test('默认导出应该存在', () => {
      expect(type).toBeDefined();
      expect(typeof type).toBe('object');
    });

    test('应该包含所有导出的函数', () => {
      expect(type.typeIs).toBeDefined();
      expect(type.objectHas).toBeDefined();
      expect(type.arrayLike).toBeDefined();
      expect(type.isString).toBeDefined();
      expect(type.isBoolean).toBeDefined();
      expect(type.isSymbol).toBeDefined();
      expect(type.isBigInt).toBeDefined();
      expect(type.isNumber).toBeDefined();
      expect(type.isUndefined).toBeDefined();
      expect(type.isNull).toBeDefined();
      expect(type.isPrimitive).toBeDefined();
      expect(type.isNullOrUnDef).toBeDefined();
      expect(type.isNullish).toBeDefined();
      expect(type.isObject).toBeDefined();
      expect(type.isArray).toBeDefined();
      expect(type.isFunction).toBeDefined();
      expect(type.isNaN).toBeDefined();
      expect(type.isDate).toBeDefined();
      expect(type.isError).toBeDefined();
      expect(type.isRegExp).toBeDefined();
      expect(type.isJsonString).toBeDefined();
      expect(type.isEmpty).toBeDefined();
      expect(type.isNodeList).toBeDefined();
    });

    test('函数应该可以正常工作', () => {
      expect(type.isString('hello')).toBe(true);
      expect(type.isNumber(123)).toBe(true);
      expect(type.isArray([1, 2, 3])).toBe(true);
      expect(type.isObject({})).toBe(true);
      expect(type.isNull(null)).toBe(true);
      expect(type.isUndefined(undefined)).toBe(true);
      expect(type.isEmpty([])).toBe(true);
    });
  });

  describe('date 模块默认导入', () => {
    test('默认导出应该存在', () => {
      expect(date).toBeDefined();
      expect(typeof date).toBe('object');
    });

    test('应该包含所有导出的函数', () => {
      expect(date.isValidDate).toBeDefined();
      expect(date.dateParse).toBeDefined();
      expect(date.dateToStart).toBeDefined();
      expect(date.dateToEnd).toBeDefined();
      expect(date.formatDate).toBeDefined();
      expect(date.calculateDate).toBeDefined();
    });

    test('函数应该可以正常工作', () => {
      const d = new Date('2023-01-01');
      expect(date.isValidDate(d)).toBe(true);
      expect(date.formatDate(d)).toContain('2023-01-01');
      expect(date.calculateDate('2023-01-01', { days: 1 })).toBe('2023-01-02');
    });
  });

  describe('object 模块默认导入', () => {
    test('默认导出应该存在', () => {
      expect(object).toBeDefined();
      expect(typeof object).toBe('object');
    });

    test('应该包含所有导出的函数', () => {
      expect(object.isPlainObject).toBeDefined();
      expect(object.objectEach).toBeDefined();
      expect(object.objectEachAsync).toBeDefined();
      expect(object.objectMap).toBeDefined();
      expect(object.objectPick).toBeDefined();
      expect(object.objectOmit).toBeDefined();
      expect(object.objectAssign).toBeDefined();
      expect(object.objectMerge).toBeDefined();
      expect(object.objectFill).toBeDefined();
      expect(object.objectGet).toBeDefined();
    });

    test('函数应该可以正常工作', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(object.isPlainObject(obj)).toBe(true);
      expect(object.objectPick(obj, ['a', 'b'])).toEqual({ a: 1, b: 2 });
      expect(object.objectOmit(obj, ['c'])).toEqual({ a: 1, b: 2 });
    });
  });

  describe('math 模块默认导入', () => {
    test('默认导出应该存在', () => {
      expect(math).toBeDefined();
      expect(typeof math).toBe('object');
    });

    test('应该包含所有导出的函数', () => {
      expect(math.add).toBeDefined();
      expect(math.subtract).toBeDefined();
      expect(math.multiply).toBeDefined();
      expect(math.divide).toBeDefined();
      expect(math.strip).toBeDefined();
    });

    test('函数应该可以正常工作', () => {
      expect(math.add(0.1, 0.2)).toBe(0.3);
      expect(math.subtract(5, 3)).toBe(2);
      expect(math.multiply(2, 3)).toBe(6);
      expect(math.divide(6, 2)).toBe(3);
    });
  });

  describe('number 模块默认导入', () => {
    test('默认导出应该存在', () => {
      expect(number).toBeDefined();
      expect(typeof number).toBe('object');
    });

    test('应该包含所有导出的函数', () => {
      expect(number.HEX_POOL).toBeDefined();
      expect(number.numberToHex).toBeDefined();
      expect(number.numberAbbr).toBeDefined();
      expect(number.humanFileSize).toBeDefined();
      expect(number.formatNumber).toBeDefined();
      expect(number.formatMoney).toBeDefined();
    });

    test('函数应该可以正常工作', () => {
      expect(number.formatNumber(1234567)).toBe('1,234,567');
      expect(number.humanFileSize(1024)).toBe('1 KiB');
    });
  });

  describe('url 模块默认导入', () => {
    test('默认导出应该存在', () => {
      expect(url).toBeDefined();
      expect(typeof url).toBe('object');
    });

    test('应该包含所有导出的函数', () => {
      expect(url.urlParse).toBeDefined();
      expect(url.urlStringify).toBeDefined();
      expect(url.urlSetParams).toBeDefined();
      expect(url.urlDelParams).toBeDefined();
    });
  });

  describe('qs 模块默认导入', () => {
    test('默认导出应该存在', () => {
      expect(qs).toBeDefined();
      expect(typeof qs).toBe('object');
    });

    test('应该包含所有导出的函数', () => {
      expect(qs.qsParse).toBeDefined();
      expect(qs.qsStringify).toBeDefined();
    });
  });

  describe('path 模块默认导入', () => {
    test('默认导出应该存在', () => {
      expect(path).toBeDefined();
      expect(typeof path).toBe('object');
    });

    test('应该包含所有导出的函数', () => {
      expect(path.pathJoin).toBeDefined();
      expect(path.pathNormalize).toBeDefined();
    });
  });

  describe('async 模块默认导入', () => {
    test('默认导出应该存在', () => {
      expect(async).toBeDefined();
      expect(typeof async).toBe('object');
    });

    test('应该包含所有导出的函数', () => {
      expect(async.wait).toBeDefined();
      expect(async.asyncMap).toBeDefined();
      expect(async.safeAwait).toBeDefined();
    });
  });

  describe('func 模块默认导入', () => {
    test('默认导出应该存在', () => {
      expect(func).toBeDefined();
      expect(typeof func).toBe('object');
    });

    test('应该包含所有导出的函数', () => {
      expect(func.debounce).toBeDefined();
      expect(func.throttle).toBeDefined();
      expect(func.once).toBeDefined();
      expect(func.getGlobal).toBeDefined();
      expect(func.setGlobal).toBeDefined();
    });
  });

  describe('random 模块默认导入', () => {
    test('默认导出应该存在', () => {
      expect(random).toBeDefined();
      expect(typeof random).toBe('object');
    });

    test('应该包含所有导出的函数', () => {
      expect(random.STRING_POOL).toBeDefined();
      expect(random.randomNumber).toBeDefined();
      expect(random.randomString).toBeDefined();
      expect(random.randomUuid).toBeDefined();
    });
  });

  describe('validator 模块默认导入', () => {
    test('默认导出应该存在', () => {
      expect(validator).toBeDefined();
      expect(typeof validator).toBe('object');
    });

    test('应该包含所有导出的函数', () => {
      expect(validator.EMAIL_REGEX).toBeDefined();
      expect(validator.HTTP_URL_REGEX).toBeDefined();
      expect(validator.IPV4_REGEX).toBeDefined();
      expect(validator.IPV6_REGEX).toBeDefined();
      expect(validator.PHONE_REGEX).toBeDefined();
      expect(validator.URL_REGEX).toBeDefined();
      expect(validator.isDigit).toBeDefined();
      expect(validator.isEmail).toBeDefined();
      expect(validator.isFloat).toBeDefined();
      expect(validator.isIdNo).toBeDefined();
      expect(validator.isInteger).toBeDefined();
      expect(validator.isIpV4).toBeDefined();
      expect(validator.isIpV6).toBeDefined();
      expect(validator.isNumerical).toBeDefined();
      expect(validator.isPhone).toBeDefined();
      expect(validator.isUrl).toBeDefined();
    });

    test('函数应该可以正常工作', () => {
      expect(validator.isEmail('test@example.com')).toBe(true);
      expect(validator.isPhone('13800138000')).toBe(true);
      expect(validator.isUrl('https://example.com')).toBe(true);
    });
  });

  describe('tree 模块默认导入', () => {
    test('默认导出应该存在', () => {
      expect(tree).toBeDefined();
      expect(typeof tree).toBe('object');
    });

    test('应该包含所有导出的函数', () => {
      expect(tree.forEachDeep).toBeDefined();
      expect(tree.findDeep).toBeDefined();
      expect(tree.filterDeep).toBeDefined();
      expect(tree.mapDeep).toBeDefined();
      expect(tree.searchTreeById).toBeDefined();
      expect(tree.formatTree).toBeDefined();
      expect(tree.flatTree).toBeDefined();
      expect(tree.fuzzySearchTree).toBeDefined();
    });
  });

  describe('base64 模块默认导入', () => {
    test('默认导出应该存在', () => {
      expect(base64).toBeDefined();
      expect(typeof base64).toBe('object');
    });

    test('应该包含所有导出的函数', () => {
      expect(base64.weBtoa).toBeDefined();
      expect(base64.weAtob).toBeDefined();
      expect(base64.b64decode).toBeDefined();
      expect(base64.b64encode).toBeDefined();
    });

    test('函数应该可以正常工作', () => {
      const str = 'hello';
      const encoded = base64.b64encode(str);
      const decoded = base64.b64decode(encoded);
      expect(decoded).toBe(str);
    });
  });

  describe('unique 模块默认导入', () => {
    test('默认导出应该存在', () => {
      expect(unique).toBeDefined();
      expect(typeof unique).toBe('object');
    });

    test('应该包含所有导出的函数', () => {
      expect(unique.UNIQUE_NUMBER_SAFE_LENGTH).toBeDefined();
      expect(unique.uniqueNumber).toBeDefined();
      expect(unique.uniqueString).toBeDefined();
    });
  });

  describe('variable 模块默认导入', () => {
    test('默认导出应该存在', () => {
      expect(variable).toBeDefined();
      expect(typeof variable).toBe('object');
    });

    test('应该包含所有导出的函数', () => {
      expect(variable.escapeRegExp).toBeDefined();
      expect(variable.executeInScope).toBeDefined();
      expect(variable.parseVarFromString).toBeDefined();
      expect(variable.replaceVarFromString).toBeDefined();
      expect(variable.uniqueSymbol).toBeDefined();
    });
  });

  describe('clipboard 模块默认导入', () => {
    test('默认导出应该存在', () => {
      expect(clipboard).toBeDefined();
      expect(typeof clipboard).toBe('object');
    });

    test('应该包含所有导出的函数', () => {
      expect(clipboard.copyText).toBeDefined();
      expect(clipboard.fallbackCopyText).toBeDefined();
    });
  });

  describe('cookie 模块默认导入', () => {
    test('默认导出应该存在', () => {
      expect(cookie).toBeDefined();
      expect(typeof cookie).toBe('object');
    });

    test('应该包含所有导出的函数', () => {
      expect(cookie.cookieSet).toBeDefined();
      expect(cookie.cookieGet).toBeDefined();
      expect(cookie.cookieDel).toBeDefined();
    });
  });

  describe('dom 模块默认导入', () => {
    test('默认导出应该存在', () => {
      expect(dom).toBeDefined();
      expect(typeof dom).toBe('object');
    });

    test('应该包含所有导出的函数', () => {
      expect(dom.hasClass).toBeDefined();
      expect(dom.addClass).toBeDefined();
      expect(dom.removeClass).toBeDefined();
      expect(dom.setStyle).toBeDefined();
      expect(dom.getStyle).toBeDefined();
      expect(dom.getComputedCssVal).toBeDefined();
      expect(dom.getStrWidthPx).toBeDefined();
      expect(dom.select).toBeDefined();
    });
  });

  describe('download 模块默认导入', () => {
    test('默认导出应该存在', () => {
      expect(download).toBeDefined();
      expect(typeof download).toBe('object');
    });

    test('应该包含所有导出的函数', () => {
      expect(download.downloadURL).toBeDefined();
      expect(download.downloadHref).toBeDefined();
      expect(download.downloadBlob).toBeDefined();
      expect(download.crossOriginDownload).toBeDefined();
      expect(download.downloadData).toBeDefined();
    });
  });

  describe('file 模块默认导入', () => {
    test('默认导出应该存在', () => {
      expect(file).toBeDefined();
      expect(typeof file).toBe('object');
    });

    test('应该包含所有导出的函数', () => {
      expect(file.supportCanvas).toBeDefined();
      expect(file.chooseLocalFile).toBeDefined();
      expect(file.compressImg).toBeDefined();
    });
  });

  describe('watermark 模块默认导入', () => {
    test('默认导出应该存在', () => {
      expect(watermark).toBeDefined();
      expect(typeof watermark).toBe('object');
    });

    test('应该包含所有导出的函数', () => {
      expect(watermark.genCanvasWM).toBeDefined();
    });
  });

  describe('tooltip 模块默认导入', () => {
    test('默认导出应该存在', () => {
      expect(tooltip).toBeDefined();
      expect(typeof tooltip).toBe('object');
    });

    test('应该包含所有导出的函数', () => {
      expect(tooltip.tooltipEvent).toBeDefined();
    });
  });

  describe('cloneDeep 模块默认导入', () => {
    test('默认导出应该存在', () => {
      expect(cloneDeep).toBeDefined();
      expect(typeof cloneDeep).toBe('object');
    });

    test('应该包含所有导出的函数', () => {
      expect(cloneDeep.cloneDeep).toBeDefined();
    });

    test('函数应该可以正常工作', () => {
      const obj = { a: 1, b: { c: 2 } };
      const cloned = cloneDeep.cloneDeep(obj);
      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
    });
  });

  describe('isEqual 模块默认导入', () => {
    test('默认导出应该存在', () => {
      expect(isEqual).toBeDefined();
      expect(typeof isEqual).toBe('object');
    });

    test('应该包含所有导出的函数', () => {
      expect(isEqual.isEqual).toBeDefined();
    });

    test('函数应该可以正常工作', () => {
      expect(isEqual.isEqual(1, 1)).toBe(true);
      expect(isEqual.isEqual(1, 2)).toBe(false);
      expect(isEqual.isEqual({ a: 1 }, { a: 1 })).toBe(true);
    });
  });

  describe('unicodeToolkit 模块默认导入', () => {
    test('默认导出应该存在', () => {
      expect(unicodeToolkit).toBeDefined();
      expect(typeof unicodeToolkit).toBe('object');
    });

    test('应该包含所有导出的函数', () => {
      expect(unicodeToolkit.UnicodeToolkit).toBeDefined();
    });
  });
});
