// 常用类型定义
const { toString, hasOwnProperty, propertyIsEnumerable } = Object.prototype;
/** 任意函数 */
export type AnyFunc<R = any> = (...args: any[]) => R;

/** 任意数组 */
export type AnyArray = any[];
/** 取出数组元素 */
export type ArrayElements<A> = A extends Array<infer R> ? R : never;

/** 任意对象 */
export type AnyObject = Record<string | number, any>;

/** 异步回调函数 */
export type AsyncCallback = {
  successCallback?: Function;
  failCallback?: Function;
};

export interface Fn<T = any, R = T> {
  (...arg: T[]): R;
}

export interface PromiseFn<T = any, R = T> {
  (...arg: T[]): Promise<R>;
}

/**
 * 将除指定属性外的所有属性变为必填
 *
 * Change all properties except the specified properties to required
 */
export type ChangeRequiredExcept<T, K extends keyof T> = Required<Omit<T, K>> & Partial<Pick<T, K>>;
/**
 * 将指定属性变为可选
 *
 * Change the specified properties to optional
 */
export type ChangeOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * 将指定属性变为必填
 *
 * Change the specified properties to required
 */
export type ChangeRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

// 浅对象
// 如原对象是 {a: {b: {c: 1, d: 2}}}
// 浅对象可以提取为：{a: {b: {c: 1}}}
export type PartialDeep<T> = {
  [P in keyof T]?: PartialDeep<T[P]>;
};

/**
 * 判断对象内是否有该静态属性
 * @param {object} obj
 * @param {string} key
 * @returns {boolean}
 */
export function objectHas<T extends AnyObject>(obj: T, key: keyof T): boolean {
  return hasOwnProperty.call(obj, key);
}

/**
 * 判断一个对象是否为类数组
 *
 * @param any
 * @returns {boolean}
 */
export function arrayLike(any: unknown): boolean {
  if (isArray(any)) return true;

  if (isString(any)) return true;

  if (!isObject(any)) return false;

  return objectHas(any, 'length');
}

/**
 * 判断任意值的数据类型，检查非对象时不如typeof、instanceof的性能高
 *
 * 当检查类对象时是不可靠的，对象可以通过定义 Symbol.toStringTag 属性来更改检查结果
 *
 * 详见：https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/toString
 * @param {unknown} any
 * @returns
 */
export function typeIs(
  any: unknown
):
  | 'Null'
  | 'Undefined'
  | 'Symbol'
  | 'Boolean'
  | 'Number'
  | 'String'
  | 'Function'
  | 'Date'
  | 'RegExp'
  | 'Map'
  | 'Set'
  | 'ArrayBuffer'
  | 'Object'
  | 'Array'
  | 'Error'
  | 'BigInt'
  | 'Promise'
  | 'AsyncFunction'
  | string {
  return toString.call(any).slice(8, -1);
}

// 基本数据类型判断
export const isString = (any: unknown): any is string => typeof any === 'string';
export const isBoolean = (any: unknown): any is boolean => typeof any === 'boolean';
export const isSymbol = (any: unknown): any is symbol => typeof any === 'symbol';
export const isBigInt = (any: unknown): any is bigint => typeof any === 'bigint';
export const isNumber = (any: unknown): any is number => typeof any === 'number' && !Number.isNaN(any);
export const isUndefined = (any: unknown): any is undefined => typeof any === 'undefined';
export const isNull = (any: unknown): any is null => any === null;
export const isPrimitive = (any: unknown): boolean => any === null || typeof any !== 'object';
export function isNullOrUnDef(val: unknown): val is null | undefined {
  return isUndefined(val) || isNull(val);
}
export { isNullOrUnDef as isNullish };

// 复合数据类型判断
export const isObject = (any: unknown): any is Record<string, unknown> => typeIs(any) === 'Object';
export const isArray = (any: unknown): any is Array<unknown> => Array.isArray(any);

/**
 * 判断是否为函数
 * @param {unknown} any
 * @returns {boolean}
 */
export const isFunction = (any: unknown): any is Function => typeof any === 'function';

// 对象类型判断
export const isNaN = (any: unknown): any is number => Number.isNaN(any as number);
export const isDate = (any: unknown): any is Date => typeIs(any) === 'Date';
export const isError = (any: unknown): any is Error => typeIs(any) === 'Error';
export const isRegExp = (any: unknown): any is RegExp => typeIs(any) === 'RegExp';
/**
 * 判断一个字符串是否为有效的 JSON, 若有效则返回有效的JSON对象，否则false
 * @param {string} str
 * @returns {Object | boolean}
 */
export function isJsonString(str: string): Object | boolean {
  try {
    const parsed = JSON.parse(str);
    return typeof parsed === 'object' && parsed !== null ? parsed : false;
  } catch (e) {
    return false;
  }
}

/**
 * Checks if `value` is an empty object, collection, map, or set.
 *
 * Objects are considered empty if they have no own enumerable string keyed
 * properties.
 *
 * Array-like values such as `arguments` objects, arrays, buffers, strings, or
 * jQuery-like collections are considered empty if they have a `length` of `0`.
 * Similarly, maps and sets are considered empty if they have a `size` of `0`.
 *
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is empty, else `false`.
 * @example
 *
 * isEmpty(null);
 * // => true
 *
 * isEmpty(true);
 * // => true
 *
 * isEmpty(1);
 * // => true
 *
 * isEmpty([1, 2, 3]);
 * // => false
 *
 * isEmpty({ 'a': 1 });
 * // => false
 */
export function isEmpty(value: any): boolean {
  if (isNullOrUnDef(value) || Number.isNaN(value)) {
    return true;
  }
  const tag = typeIs(value);

  if (arrayLike(value) || 'Arguments' === tag) {
    return !value.length;
  }
  if ('Set' === tag || 'Map' === tag) {
    return !value.size;
  }

  return !Object.keys(value).length;
}

export default typeIs;
