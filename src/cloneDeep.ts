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
