import typeIs, {
  AnyArray,
  AnyObject,
  ArrayElements,
  isArray,
  isNumber,
  isObject,
  isUndefined,
  objectHas
} from './type';

/**
 * 判断对象是否为纯对象
 * @param {object} obj
 * @returns {boolean}
 */
export const isPlainObject = (obj: unknown): boolean => {
  if (!isObject(obj)) return false;

  const proto: unknown = Object.getPrototypeOf(obj);

  // 对象无原型
  if (!proto) return true;

  // 是否对象直接实例
  return proto === Object.prototype;
};

/**
 * 遍历对象，返回 false 中断遍历
 * @param {O} obj
 * @param {(val: O[keyof O], key: keyof O) => (boolean | void)} iterator
 */
export function objectEach<O extends AnyObject>(
  obj: O,
  iterator: (val: O[keyof O], key: Extract<keyof O, string>) => any
): void {
  for (const key in obj) {
    if (!objectHas(obj, key)) continue;

    if (iterator(obj[key], key) === false) break;
  }
}

/**
 * 异步遍历对象，返回 false 中断遍历
 * @param {O} obj
 * @param {(val: O[keyof O], key: keyof O) => (boolean | void)} iterator
 */
export async function objectEachAsync<O extends AnyObject>(
  obj: O,
  iterator: (val: O[keyof O], key: Extract<keyof O, string>) => Promise<any> | any
): Promise<void> {
  for (const key in obj) {
    if (!objectHas(obj, key)) continue;

    if ((await iterator(obj[key], key)) === false) break;
  }
}

/**
 * 对象映射
 * @param {O} obj
 * @param {(val: O[keyof O], key: Extract<keyof O, string>) => any} iterator
 * @returns {Record<Extract<keyof O, string>, T>}
 */
export function objectMap<O extends AnyObject, T>(
  obj: O,
  iterator: (val: O[keyof O], key: Extract<keyof O, string>) => any
): Record<Extract<keyof O, string>, T> {
  const obj2 = {} as Record<Extract<keyof O, string>, T>;

  for (const key in obj) {
    if (!objectHas(obj, key)) continue;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    obj2[key] = iterator(obj[key], key);
  }

  return obj2;
}

/**
 * 对象提取
 * @param {O} obj
 * @param {K} keys
 * @returns {Pick<O, ArrayElements<K>>}
 */
export function objectPick<O extends AnyObject, K extends Extract<keyof O, string>[]>(
  obj: O,
  keys: K
): Pick<O, ArrayElements<K>> {
  const obj2 = {} as Pick<O, ArrayElements<K>>;
  objectEach(obj, (v, k) => {
    if (keys.includes(k)) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      obj2[k] = v;
    }
  });
  return obj2;
}
/**
 * 对象去除
 * @param {O} obj
 * @param {K} keys
 * @returns {Pick<O, ArrayElements<K>>}
 */
export function objectOmit<O extends AnyObject, K extends Extract<keyof O, string>[]>(
  obj: O,
  keys: K
): Omit<O, ArrayElements<K>> {
  const obj2 = {} as Omit<O, ArrayElements<K>>;
  objectEach(obj, (v, k) => {
    if (!keys.includes(k)) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      obj2[k] = v;
    }
  });
  return obj2;
}

const merge = (map: Map<AnyObject | AnyArray, AnyObject | AnyArray>, source: unknown, target: unknown): unknown => {
  if (isUndefined(target)) return source;

  const sourceType = typeIs(source);
  const targetType = typeIs(target);

  if (sourceType !== targetType) {
    if (isArray(target)) return merge(map, [], target);
    if (isObject(target)) return merge(map, {}, target);
    return target;
  }

  // 朴素对象
  if (isPlainObject(target)) {
    const exist = map.get(target as AnyObject);

    if (exist) return exist;

    map.set(target as AnyObject, source as AnyObject);
    objectEach(target as AnyObject, (val, key) => {
      (source as AnyObject)[key] = merge(map, (source as AnyObject)[key], val);
    });

    return source;
  }
  // 数组
  else if (isArray(target)) {
    const exist = map.get(target);

    if (exist) return exist;

    map.set(target, source as AnyArray);
    target.forEach((val, index) => {
      (source as AnyArray)[index] = merge(map, (source as AnyArray)[index], val);
    });

    return source;
  }

  return target;
};

export type ObjectAssignItem = AnyObject | AnyArray;
interface ObjectAssign {
  <R = ObjectAssignItem>(source: ObjectAssignItem, ...args: (ObjectAssignItem | undefined)[]): R;
  <R = ObjectAssignItem>(source: ObjectAssignItem): R;
}

/**
 * 对象合并，返回原始对象
 * @param {ObjectAssignItem} source
 * @param {ObjectAssignItem | undefined} targets
 * @returns {R}
 */
export function objectAssign<R = AnyObject | AnyArray>(
  source: ObjectAssignItem,
  ...targets: (ObjectAssignItem | undefined)[]
): R {
  const map = new Map();

  for (let i = 0, len = targets.length; i < len; i++) {
    const target = targets[i];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    source = merge(map, source, target);
  }

  map.clear();
  return source as R;
}
export { objectAssign as objectMerge };

/**
 * 对象填充
 * @param {Partial<R>} source
 * @param {Partial<R>} target
 * @param {(s: Partial<R>, t: Partial<R>, key: keyof R) => boolean} fillable
 * @returns {R}
 */
export function objectFill<R extends AnyObject = AnyObject>(
  source: Partial<R>,
  target: Partial<R>,
  fillable?: (s: typeof source, t: typeof target, key: keyof R) => boolean
): R {
  const _fillable = fillable || ((source, target, key) => source[key] === undefined);
  objectEach(target, (val, key) => {
    if (_fillable(source, target, key)) {
      source[key] = val;
    }
  });

  return source as R;
}
/**
 * 获取对象指定层级下的属性值（现在可用ES6+的可选链?.来替代）
 * @param {AnyObject} obj
 * @param {string} path
 * @param {boolean} strict
 * @returns
 */
export function objectGet(
  obj: AnyObject,
  path: string,
  strict = false
): {
  p: any | undefined;
  k: string | undefined;
  v: any | undefined;
} {
  path = path.replace(/\[(\w+)\]/g, '.$1');
  path = path.replace(/^\./, '');

  const keyArr = path.split('.');
  let tempObj: any = obj;
  let i = 0;
  for (let len = keyArr.length; i < len - 1; ++i) {
    const key = keyArr[i];

    if (isNumber(Number(key)) && Array.isArray(tempObj)) {
      tempObj = tempObj[key];
    } else if (isObject(tempObj) && objectHas(tempObj, key)) {
      tempObj = tempObj[key];
    } else {
      tempObj = undefined;

      if (strict) {
        throw new Error('[Object] objectGet path 路径不正确');
      }
      break;
    }
  }
  return {
    p: tempObj,
    k: tempObj ? keyArr[i] : undefined,
    v: tempObj ? tempObj[keyArr[i]] : undefined
  };
}

/**
 * 深拷贝堪称完全体 即：任何类型的数据都会被深拷贝
 *
 * 包含对null、原始值、对象循环引用的处理
 *
 * 对Map、Set、ArrayBuffer、Date、RegExp、Array、Object及原型链属性方法执行深拷贝
 * @param {T} source
 * @param {WeakMap} map
 * @returns {T}
 */
export function cloneDeep<T>(source: T, map = new WeakMap<any, any>()): T {
  // 处理原始类型和 null/undefined
  if (source === null || typeof source !== 'object') {
    return source;
  }

  // 处理循环引用
  if (map.has(source)) {
    return map.get(source);
  }

  // 处理 ArrayBuffer
  if (source instanceof ArrayBuffer) {
    const copy = new ArrayBuffer(source.byteLength);
    new Uint8Array(copy).set(new Uint8Array(source));
    map.set(source, copy);
    return copy as T;
  }

  // 处理 DataView 和 TypedArray (Uint8Array 等)
  if (ArrayBuffer.isView(source)) {
    const constructor = (source as any).constructor;
    const bufferCopy = cloneDeep(source.buffer, map);
    return new constructor(bufferCopy, source.byteOffset, (source as any).length) as T;
  }

  // 处理 Date 对象
  if (source instanceof Date) {
    const copy = new Date(source.getTime());
    map.set(source, copy);
    return copy as T;
  }

  // 处理 RegExp 对象
  if (source instanceof RegExp) {
    const copy = new RegExp(source.source, source.flags);
    (copy as any).lastIndex = source.lastIndex; // 保留匹配状态
    map.set(source, copy);
    return copy as T;
  }

  // 处理 Map
  if (source instanceof Map) {
    const copy = new Map();
    map.set(source, copy);
    source.forEach((value, key) => {
      copy.set(cloneDeep(key, map), cloneDeep(value, map));
    });
    return copy as T;
  }

  // 处理 Set
  if (source instanceof Set) {
    const copy = new Set();
    map.set(source, copy);
    source.forEach(value => {
      copy.add(cloneDeep(value, map));
    });
    return copy as T;
  }

  // 处理数组 (包含稀疏数组)
  if (Array.isArray(source)) {
    const copy: any[] = new Array(source.length);
    map.set(source, copy);

    // 克隆所有有效索引
    for (let i = 0, len = source.length; i < len; i++) {
      if (i in source) {
        // 保留空位
        copy[i] = cloneDeep(source[i], map);
      }
    }

    // 克隆数组的自定义属性
    const descriptors = Object.getOwnPropertyDescriptors(source);
    for (const key of Reflect.ownKeys(descriptors)) {
      Object.defineProperty(copy, key, {
        ...descriptors[key as any],
        value: cloneDeep(descriptors[key as any].value, map)
      });
    }

    return copy as T;
  }

  // 处理普通对象和类实例
  const copy = Object.create(Object.getPrototypeOf(source));
  map.set(source, copy);

  const descriptors = Object.getOwnPropertyDescriptors(source);
  for (const key of Reflect.ownKeys(descriptors)) {
    const descriptor = descriptors[key as any];

    if ('value' in descriptor) {
      // 克隆数据属性
      descriptor.value = cloneDeep(descriptor.value, map);
    } else {
      // 处理访问器属性 (getter/setter)
      if (descriptor.get) {
        descriptor.get = cloneDeep(descriptor.get, map);
      }
      if (descriptor.set) {
        descriptor.set = cloneDeep(descriptor.set, map);
      }
    }

    Object.defineProperty(copy, key, descriptor);
  }

  return copy;
}

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
