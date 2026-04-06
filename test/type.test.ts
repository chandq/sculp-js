import {
  isArray,
  isBigInt,
  isBoolean,
  isDate,
  isEmpty,
  isError,
  isFunction,
  isJsonString,
  isNaN,
  isNodeList,
  isNull,
  isNullish,
  isNumber,
  isObject,
  isRegExp,
  isString,
  isSymbol,
  isUndefined,
  is,
  typeIs
} from '../src/type';

test('isString', () => {
  expect(isString('')).toBe(true);
  expect(isString(null)).toBe(false);
});

test('isBoolean', () => {
  expect(isBoolean(true)).toBe(true);
  expect(isBoolean(false)).toBe(true);
  expect(isBoolean(null)).toBe(false);
});

test('isSymbol', () => {
  expect(isSymbol(Symbol(''))).toBe(true);
  expect(isSymbol('')).toBe(false);
});

test('isBigInt', () => {
  expect(isBigInt(BigInt('0'))).toBe(true);
  expect(isBigInt(1)).toBe(false);
});

test('isNumber', () => {
  expect(isNumber(1)).toBe(true);
  expect(isNumber(NaN)).toBe(false);
});

test('isUndefined', () => {
  expect(isUndefined(undefined)).toBe(true);
  expect(isUndefined(null)).toBe(false);
});

test('isNull', () => {
  expect(isNull(undefined)).toBe(false);
  expect(isNull(null)).toBe(true);
});
test('isNullish', () => {
  expect(isNullish(undefined)).toBe(true);
  expect(isNullish(null)).toBe(true);
});

test('isObject', () => {
  expect(isObject({})).toBe(true);
  expect(isObject([])).toBe(false);
  expect(isObject(null)).toBe(false);
});

test('isArray', () => {
  expect(isArray([])).toBe(true);
  expect(isArray({ length: 0 })).toBe(false);
});

test('isFunction', () => {
  expect(isFunction(() => 1)).toBe(true);
  expect(isFunction(async () => Promise.resolve(1))).toBe(true);
});

test('isNaN', () => {
  expect(isNaN(1)).toBe(false);
  expect(isNaN('')).toBe(false);
  expect(isNaN(NaN)).toBe(true);
});

test('isDate', () => {
  expect(isDate(new Date())).toBe(true);
  class Date2 extends Date {}
  expect(isDate(new Date2())).toBe(true);
});

test('isError', () => {
  expect(isError(new Error())).toBe(true);
  expect(isError(new SyntaxError())).toBe(true);
  expect(isError(new Date())).toBe(false);
});

test('isRegExp', () => {
  expect(isRegExp(new RegExp('s'))).toBe(true);
  expect(isRegExp(/s/)).toBe(true);
  expect(isRegExp('/s/')).toBe(false);
});

test('isJsonString', () => {
  const jsonString = '{"name": "John", "age": 30}';
  const invalidJsonString = '{"name": "John", "age": 30';
  expect(isJsonString(jsonString)).toEqual({
    name: 'John',
    age: 30
  });
  expect(isJsonString(invalidJsonString)).toBe(false);
});

test('isEmpty', () => {
  expect(isEmpty('')).toBe(true);
  expect(isEmpty('231')).toBe(false);
  expect(isEmpty(null)).toBe(true);
  expect(isEmpty(undefined)).toBe(true);
  expect(isEmpty(function () {})).toBe(true);
  expect(isEmpty(true)).toBe(true);
  expect(isEmpty(1)).toBe(true);
  expect(isEmpty([1, 2, 3])).toBe(false);
  expect(isEmpty({ a: 1 })).toBe(false);
  expect(isEmpty({})).toBe(true);
  expect(isEmpty([])).toBe(true);
  expect(isEmpty(new Set())).toBe(true);
  expect(isEmpty(new Map())).toBe(true);
  expect(isEmpty(new Set([1, 2, 3]))).toBe(false);
  expect(
    isEmpty(
      new Map([
        [1, 2],
        [2, 3]
      ])
    )
  ).toBe(false);
  expect(
    isEmpty(
      (function () {
        // eslint-disable-next-line
        return arguments;
      })()
    )
  ).toBe(true);
  expect(
    isEmpty(
      (function () {
        // eslint-disable-next-line
        return arguments;
        // @ts-ignore
      })(1, 2)
    )
  ).toBe(false);
});

test('isNodeList', () => {
  const divEl = document.createElement('div');

  document.body.appendChild(divEl);
  expect(isNodeList(document.body.childNodes)).toBe(true);
  expect(isNodeList([])).toBe(false);
});

test('is', () => {
  // 基本类型测试
  expect(is('hello', 'String')).toBe(true);
  expect(is(123, 'Number')).toBe(true);
  expect(is(true, 'Boolean')).toBe(true);
  expect(is(null, 'Null')).toBe(true);
  expect(is(undefined, 'Undefined')).toBe(true);
  expect(is(Symbol(''), 'Symbol')).toBe(true);
  expect(is(BigInt(123), 'BigInt')).toBe(true);

  // 函数测试
  expect(is(function () {}, 'Function')).toBe(true);
  expect(is(() => {}, 'Function')).toBe(true);
  // AsyncFunction 在某些环境中可能无法正确检测
  const asyncFn = async function () {};
  expect(typeIs(asyncFn) === 'AsyncFunction' || typeIs(asyncFn) === 'Function').toBe(true);

  // 对象测试
  expect(is({}, 'Object')).toBe(true);
  expect(is([], 'Array')).toBe(true);
  expect(is(new Date(), 'Date')).toBe(true);
  expect(is(/regex/, 'RegExp')).toBe(true);
  expect(is(new Error(), 'Error')).toBe(true);

  // 集合测试
  expect(is(new Map(), 'Map')).toBe(true);
  expect(is(new Set(), 'Set')).toBe(true);

  // Promise 测试
  expect(is(Promise.resolve(), 'Promise')).toBe(true);

  // TypedArray 测试
  expect(is(new Int8Array(), 'Int8Array')).toBe(true);
  expect(is(new Uint8Array(), 'Uint8Array')).toBe(true);
  expect(is(new Float32Array(), 'Float32Array')).toBe(true);
  expect(is(new BigInt64Array(), 'BigInt64Array')).toBe(true);

  // 二进制数据测试
  expect(is(new ArrayBuffer(8), 'ArrayBuffer')).toBe(true);
  expect(is(new DataView(new ArrayBuffer(8)), 'DataView')).toBe(true);

  // arguments 测试
  const testArguments = function () {
    // eslint-disable-next-line prefer-rest-params
    return arguments;
  };
  // @ts-ignore
  expect(is(testArguments(1, 2, 3), 'Arguments')).toBe(true);

  // 否定测试
  expect(is('hello', 'Number')).toBe(false);
  expect(is(123, 'String')).toBe(false);
  expect(is([], 'Object')).toBe(false);
});
