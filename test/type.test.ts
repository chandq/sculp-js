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
  isNull,
  isNumber,
  isObject,
  isRegExp,
  isString,
  isSymbol,
  isUndefined
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
});
