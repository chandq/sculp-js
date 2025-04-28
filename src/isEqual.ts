import { isObject } from './type';

export type Comparable =
  | null
  | undefined
  | boolean
  | number
  | string
  | Date
  | RegExp
  | Map<any, any>
  | Set<any>
  | ArrayBuffer
  | object
  | Array<any>;
/**
 * 比较两值是否相等，适用所有数据类型
 * @param {Comparable} a
 * @param {Comparable} b
 * @returns {boolean}
 */
export function isEqual(a: Comparable, b: Comparable): boolean {
  return deepEqual(a, b);
}

function deepEqual(a: any, b: any, compared = new WeakMap()): boolean {
  // 相同值快速返回
  if (Object.is(a, b)) return true;

  // 类型不同直接返回false
  const typeA = Object.prototype.toString.call(a);
  const typeB = Object.prototype.toString.call(b);
  if (typeA !== typeB) return false;

  // 只缓存对象类型
  if (isObject(a) && isObject(b)) {
    if (compared.has(a)) return compared.get(a) === b;
    compared.set(a, b);
    compared.set(b, a);
  }

  // 处理特殊对象类型
  switch (typeA) {
    case '[object Date]':
      return (a as Date).getTime() === (b as Date).getTime();

    case '[object RegExp]':
      return (a as RegExp).toString() === (b as RegExp).toString();

    case '[object Map]':
      return compareMap(a as Map<any, any>, b as Map<any, any>, compared);

    case '[object Set]':
      return compareSet(a as Set<any>, b as Set<any>, compared);

    case '[object ArrayBuffer]':
      return compareArrayBuffer(a as ArrayBuffer, b as ArrayBuffer);

    case '[object DataView]':
      return compareDataView(a as DataView, b as DataView, compared);

    case '[object Int8Array]':
    case '[object Uint8Array]':
    case '[object Uint8ClampedArray]':
    case '[object Int16Array]':
    case '[object Uint16Array]':
    case '[object Int32Array]':
    case '[object Uint32Array]':
    case '[object Float32Array]':
    case '[object Float64Array]':
      return compareTypedArray(a, b, compared);

    case '[object Object]':
      return compareObjects(a, b, compared);

    case '[object Array]':
      return compareArrays(a as any[], b as any[], compared);
  }

  return false;
}

// 辅助比较函数
function compareMap(a: Map<any, any>, b: Map<any, any>, compared: WeakMap<any, any>): boolean {
  if (a.size !== b.size) return false;
  for (const [key, value] of a) {
    if (!b.has(key) || !deepEqual(value, b.get(key), compared)) return false;
  }
  return true;
}

function compareSet(a: Set<any>, b: Set<any>, compared: WeakMap<any, any>): boolean {
  if (a.size !== b.size) return false;
  for (const value of a) {
    let found = false;
    for (const bValue of b) {
      if (deepEqual(value, bValue, compared)) {
        found = true;
        break;
      }
    }
    if (!found) return false;
  }
  return true;
}

function compareArrayBuffer(a: ArrayBuffer, b: ArrayBuffer): boolean {
  if (a.byteLength !== b.byteLength) return false;
  return new DataView(a).getInt32(0) === new DataView(b).getInt32(0);
}

function compareDataView(a: DataView, b: DataView, compared: WeakMap<any, any>): boolean {
  return a.byteLength === b.byteLength && deepEqual(new Uint8Array(a.buffer), new Uint8Array(b.buffer), compared);
}

function compareTypedArray(a: any, b: any, compared: WeakMap<any, any>): boolean {
  return a.byteLength === b.byteLength && deepEqual(Array.from(a), Array.from(b), compared);
}

function compareObjects(a: object, b: object, compared: WeakMap<any, any>): boolean {
  const keysA = Reflect.ownKeys(a);
  const keysB = Reflect.ownKeys(b);
  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual((a as any)[key], (b as any)[key], compared)) return false;
  }

  // 原型链比较
  return Object.getPrototypeOf(a) === Object.getPrototypeOf(b);
}

function compareArrays(a: any[], b: any[], compared: WeakMap<any, any>): boolean {
  // 增加有效索引检查
  const keysA = Object.keys(a).map(Number);
  const keysB = Object.keys(b).map(Number);
  if (keysA.length !== keysB.length) return false;

  // 递归比较每个元素
  for (let i = 0, len = a.length; i < len; i++) {
    if (!deepEqual(a[i], b[i], compared)) return false;
  }

  // 比较数组对象的其他属性
  return compareObjects(a, b, compared);
}
