import { qsStringify, qsParse, Replacer } from '../src/qs';
import { dateStringify } from '../src/date';
import { isBoolean, isDate, isFunction, isNull, isNumber, isString, isUndefined } from '../src/type';

test('qsParse', () => {
  expect(qsParse('a=1')).toEqual({ a: '1' });
  expect(qsParse('a=1&b=2')).toEqual({ a: '1', b: '2' });
  expect(qsParse('a=1&b=1&b=2')).toEqual({ a: '1', b: ['1', '2'] });
  expect(qsParse('a=1&a=2&b=1')).toEqual({ a: ['1', '2'], b: '1' });
  expect(qsParse('a=1&a=2&a=3&a=4')).toEqual({ a: ['1', '2', '3', '4'] });
});

test('qsStringify 默认 replacer', () => {
  const i = new Date(2020, 0, 1, 0, 0, 0, 0);
  const query = { a: 1, b: [2, 3], c: '4', d: undefined, e: null, f: true, g: false, i };
  const string = 'a=1&b=2&b=3&c=4&f=true&g=false&i=2019-12-31T16%3A00%3A00.000Z';
  expect(qsStringify(query)).toBe(string);
});

test('qsStringify 复写 replacer', () => {
  const replacer: Replacer = value => {
    if (isString(value)) return `string-${value}`;
    if (isNumber(value)) return `number-${value}`;
    if (isBoolean(value)) return `boolean-${value ? 'true' : 'false'}`;
    if (isUndefined(value)) return 'undefined';
    if (isNull(value)) return 'null';
    if (isDate(value)) return 'date-' + dateStringify(value, 'YYYY-MM-DD HH:mm:ss');
    return null;
  };
  const i = new Date(2020, 0, 1, 0, 0, 0, 0);
  const query = { a: 1, b: [2, 3], c: '4', d: undefined, e: null, f: true, g: false, i };
  const string =
    'a=number-1&b=number-2&b=number-3&c=string-4&d=undefined&e=null&' +
    'f=boolean-true&g=boolean-false&i=date-2020-01-01+00%3A00%3A00';
  expect(qsStringify(query, replacer)).toBe(string);
});
