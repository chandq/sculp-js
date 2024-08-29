// 常用类型定义
/** 任意函数 */
export type AnyFunc<R = any> = (...args: any[]) => R;

/** 任意数组 */
export type AnyArray = any[];
/** 取出数组元素 */
export type ArrayElements<A> = A extends Array<infer R> ? R : never;

/** 任意对象 */
export type AnyObject = Record<string | number, any>;

// 浅对象
// 如原对象是 {a: {b: {c: 1, d: 2}}}
// 浅对象可以提取为：{a: {b: {c: 1}}}
export type PartialDeep<T> = {
  [P in keyof T]?: PartialDeep<T[P]>;
};

/**
 * 判断任意值的数据类型
 * @param {unknown} any
 * @returns {string}
 */
export const typeIs = (any: unknown): string => Object.prototype.toString.call(any).slice(8, -1);

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
 * 判断一个字符串是否为有效的 JSON
 * @param {string} str
 * @return {boolean}
 */
export function isJsonString(str: string): boolean {
  try {
    const parsed = JSON.parse(str);
    return typeof parsed === 'object' && parsed !== null;
  } catch (e) {
    return false;
  }
}

export default typeIs;
