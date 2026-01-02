/**
 * 使用位运算或常量定义常用 Tag，这里保持字符串以匹配 Object.prototype.toString
 */
const TAGS = {
  MAP: '[object Map]',
  SET: '[object Set]',
  DATE: '[object Date]',
  REGEXP: '[object RegExp]',
  SYMBOL: '[object Symbol]',
  ARRAY_BUFFER: '[object ArrayBuffer]',
  DATA_VIEW: '[object DataView]',
  ARGUMENTS: '[object Arguments]'
} as const;
const { toString, hasOwnProperty } = Object.prototype;

/**
 * 获取对象类型的辅助函数
 */
const getTag = (value: any): string => toString.call(value);

/**
 * 类型定义：用于循环引用的栈
 */
type Stack = WeakMap<object, object>;

/**
 * @description 深度比较两个值是否相等（支持循环引用、各种内置对象类型）
 * @performance
 * 1. 快速路径：引用相等和 NaN 检查
 * 2. 快速失败：优先比较 constructor、length 和 size
 * 3. 惰性 getTag：仅在构造函数一致且非基础类型时获取详细类型
 * * @example
 * isEqual({ a: [1, 2] }, { a: [1, 2] }) // true
 * isEqual(new Date(0), new Date(0)) // true
 * isEqual(() => {}, () => {}) // false (不同引用)
 * * @param value 要比较的值
 * @param other 另一个要比较的值
 * @returns {boolean} 是否深度相等
 */
export function isEqual(value: any, other: any): boolean {
  return baseIsEqual(value, other);
}

function baseIsEqual(value: any, other: any, stack: Stack | undefined = undefined): boolean {
  // 1. 引用相等 (快速路径)
  if (value === other) {
    return true;
  }

  // 2. 处理 NaN
  if (value !== value && other !== other) {
    return true;
  }

  // 3. 基本类型与空值检查
  // 如果不是对象且不是函数，或者其中之一为 null，直接返回 false
  if (typeof value !== 'object' || value === null || typeof other !== 'object' || other === null) {
    return false;
  }

  // 4. 【性能优化】构造函数检查 (Fail Fast)
  // 大多数不等的情况在这里就能被拦截，避免昂贵的 getTag 操作
  // 注意：Object.create(null) 的 constructor 为 undefined
  const ctorA = value.constructor;
  const ctorB = other.constructor;
  // 严格检查：
  // 1. 解决 class A {} vs class B {} (结构相同但类不同) -> false
  // 2. 解决 {} vs Object.create(null) -> false
  if (ctorA !== ctorB) {
    return false;
  }

  // 5. 初始化栈 (惰性初始化)
  if (!stack) {
    stack = new WeakMap();
  }

  // 6. 循环引用检查
  if (stack.has(value)) {
    return stack.get(value) === other;
  }

  stack.set(value, other);

  // 7. 具体类型分发
  // 此时我们确定 value 和 other 都是非 null 的对象/函数
  const tagA = getTag(value);
  const tagB = getTag(other); // 只有在 constructor 检查通过或存疑时才走到这里

  if (tagA !== tagB) {
    return false;
  }

  let result = false;

  switch (tagA) {
    case TAGS.DATE:
      result = +value === +other;
      break;
    case TAGS.REGEXP:
      result = '' + value === '' + other;
      break;
    case TAGS.SYMBOL:
      result = Symbol.prototype.valueOf.call(value) === Symbol.prototype.valueOf.call(other);
      break;
    case TAGS.ARRAY_BUFFER:
      result = deepCompareArrayBuffer(value, other);
      break;
    case TAGS.DATA_VIEW:
      result = deepCompareDataView(value, other);
      break;
    case TAGS.MAP:
      result = deepCompareMap(value, other, stack);
      break;
    case TAGS.SET:
      result = deepCompareSet(value, other, stack);
      break;
    case TAGS.ARGUMENTS: // Arguments 视为对象或数组处理，通常 Tag 相同即可进入通用对象逻辑
    default:
      // 处理 Array, TypedArray, Object
      if (Array.isArray(value) || ArrayBuffer.isView(value)) {
        result = deepCompareArray(value as any[], other as any[], stack);
      } else {
        result = deepCompareObject(value, other, stack);
      }
  }

  // 清理栈并非必须，因为是 WeakMap，但对于逻辑完整性可以不做操作
  return result;
}

function deepCompareArray(a: any[] | ArrayBufferView, b: any[] | ArrayBufferView, stack: Stack): boolean {
  const len = (a as any).length;
  if (len !== (b as any).length) {
    return false;
  }

  // 倒序遍历，微小的性能提升
  let i = len;
  while (i--) {
    if (!baseIsEqual((a as any)[i], (b as any)[i], stack)) {
      return false;
    }
  }
  return true;
}

function deepCompareArrayBuffer(a: ArrayBuffer, b: ArrayBuffer): boolean {
  if (a.byteLength !== b.byteLength) return false;
  const viewA = new Uint8Array(a);
  const viewB = new Uint8Array(b);
  let i = a.byteLength;
  while (i--) {
    if (viewA[i] !== viewB[i]) return false;
  }
  return true;
}

function deepCompareDataView(a: DataView, b: DataView): boolean {
  // 1. 长度不等直接退出
  if (a.byteLength !== b.byteLength) return false;
  // 2. 偏移量不等直接退出
  if (a.byteOffset !== b.byteOffset) return false;
  // 3. 比较底层的 buffer 内容
  return deepCompareArrayBuffer(a.buffer, b.buffer);
}

function deepCompareMap(a: Map<any, any>, b: Map<any, any>, stack: Stack): boolean {
  if (a.size !== b.size) return false;
  for (const [key, val] of a) {
    // 性能关键：Map key 比较。如果 key 是对象，需要 O(N) 查找吗？
    // 规范里 Map.get 使用 SameValueZero 算法。
    // 如果 key 是引用类型且引用不同，Map 视为不同 key。
    // isEqual 的语义下，如果 key 是两个内容相同的不同对象，我们是否应该视为匹配？
    // Lodash 的处理：是的，Map 的 key 也进行深度比较。这非常慢 (O(N^2))。
    // 这里为了性能，我们先尝试直接 get，只有拿不到时（可能 key 需要深度对比）才去遍历（Lodash 策略）。
    // 但为了保持 "超高性能" 且符合大多数业务场景，我们假设 Map key 的引用关系必须一致，
    // 或者仅仅对 primitive key 比较。
    // 这里实现一个折中方案：直接 get，如果 undefined 再深度查。

    const otherVal = b.get(key);
    if (otherVal === undefined && !b.has(key)) {
      // 只有当 key 是对象且在 b 中找不到引用相同的 key 时，才启用这个极慢的路径
      // 真正的完全深度比较逻辑非常复杂，此处保持高性能假设：Key 引用必须匹配
      return false;
    }

    if (!baseIsEqual(val, otherVal, stack)) {
      return false;
    }
  }
  return true;
}

function deepCompareSet(a: Set<any>, b: Set<any>, stack: Stack): boolean {
  if (a.size !== b.size) return false;
  for (const val of a) {
    if (b.has(val)) continue;

    // Set 中存储对象时的深度比较 (O(N^2) 复杂度风险)
    let matchFound = false;
    for (const otherVal of b) {
      if (baseIsEqual(val, otherVal, stack)) {
        matchFound = true;
        break;
      }
    }
    if (!matchFound) return false;
  }
  return true;
}

function deepCompareObject(a: any, b: any, stack: Stack): boolean {
  // 使用 Reflect.ownKeys 以支持 Symbol，这是现代前端健壮性的关键
  const keysA = Reflect.ownKeys(a);
  const keysB = Reflect.ownKeys(b);

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    // 必须检查 b 是否也有这个 key（防止原型链干扰，虽然 Reflect.ownKeys 已过滤）
    // 以及值的深度比较
    if (!hasOwnProperty.call(b, key) || !baseIsEqual(a[key], b[key], stack)) {
      return false;
    }
  }
  return true;
}
