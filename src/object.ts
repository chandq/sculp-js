import typeIs, { AnyArray, AnyObject, ArrayElements, isArray, isNumber, isObject, isUndefined } from './type';

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
 * 判断对象内是否有该静态属性
 * @param {object} obj
 * @param {string} key
 * @returns {boolean}
 */
export const objectHas = <T extends AnyObject>(obj: T, key: keyof T): boolean =>
  Object.prototype.hasOwnProperty.call(obj, key);

/**
 * 遍历对象，返回 false 中断遍历
 * @param {O} obj
 * @param {(val: O[keyof O], key: keyof O) => (boolean | void)} iterator
 */
export const objectEach = <O extends AnyObject>(
  obj: O,
  iterator: (val: O[keyof O], key: Extract<keyof O, string>) => any
): void => {
  for (const key in obj) {
    if (!objectHas(obj, key)) continue;

    if (iterator(obj[key], key) === false) break;
  }
};

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
 * 对象祛除
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
export const objectAssign = <R = AnyObject | AnyArray>(
  source: ObjectAssignItem,
  ...targets: (ObjectAssignItem | undefined)[]
): R => {
  const map = new Map();

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    source = merge(map, source, target);
  }

  map.clear();
  return source as R;
};
export { objectAssign as objectMerge };

/**
 * 对象填充
 * @param {Partial<R>} source
 * @param {Partial<R>} target
 * @param {(s: Partial<R>, t: Partial<R>, key: keyof R) => boolean} fillable
 * @returns {R}
 */
export const objectFill = <R extends AnyObject = AnyObject>(
  source: Partial<R>,
  target: Partial<R>,
  fillable?: (s: typeof source, t: typeof target, key: keyof R) => boolean
): R => {
  const _fillable = fillable || ((source, target, key) => source[key] === undefined);
  objectEach(target, (val, key) => {
    if (_fillable(source, target, key)) {
      source[key] = val;
    }
  });

  return source as R;
};

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

    if (key in tempObj) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
      tempObj = tempObj[key];
    } else {
      tempObj = undefined;

      if (strict) {
        throw new Error('[berry/js-utils/object] objectGet path 路径不正确');
      }
      break;
    }
  }
  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    p: tempObj,
    k: tempObj ? keyArr[i] : undefined,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    v: tempObj ? tempObj[keyArr[i]] : undefined
  };
}

/**
 * 深拷贝堪称完全体 即：任何类型的数据都会被深拷贝
 * @param {AnyObject | AnyArray} obj
 * @param {WeakMap} map
 * @return {AnyObject | AnyArray}
 */
export function cloneDeep(obj: Object, map = new WeakMap()): Object {
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof RegExp) return new RegExp(obj);

  if (map.has(obj)) {
    return map.get(obj);
  }

  const allDesc = Object.getOwnPropertyDescriptors(obj);
  const cloneObj = Object.create(Object.getPrototypeOf(obj), allDesc);

  map.set(obj, cloneObj);

  for (const key of Reflect.ownKeys(obj)) {
    const value = obj[key];

    cloneObj[key] = value instanceof Object && typeof value !== 'function' ? cloneDeep(value, map) : value;
  }
  return cloneObj;
}
