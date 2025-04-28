import { isEqual } from '../src/isEqual';

describe('isEqual', () => {
  // 基础类型比较
  test('primitives', () => {
    expect(isEqual(42, 42)).toBe(true);
    expect(isEqual(NaN, NaN)).toBe(true);
    expect(isEqual(0, -0)).toBe(false);
    expect(isEqual('test', 'test')).toBe(true);
    expect(isEqual(true, false)).toBe(false);
  });

  // 对象比较
  test('objects', () => {
    expect(isEqual({ a: 1 }, { a: 1 })).toBe(true);
    expect(isEqual({ a: { b: 2 } }, { a: { b: 2 } })).toBe(true);
    expect(isEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  // 数组比较
  test('arrays', () => {
    expect(isEqual([1, [2]], [1, [2]])).toBe(true);
    expect(isEqual([1, 2, 3], [1, 3, 2])).toBe(false);
    expect(isEqual(new Array(3), new Array(3))).toBe(true); // 稀疏数组
  });

  // 特殊对象比较
  test('special objects', () => {
    // Date
    const d1 = new Date('2023-01-01');
    const d2 = new Date('2023-01-01');
    expect(isEqual(d1, d2)).toBe(true);

    // RegExp
    expect(isEqual(/test/gi, /test/gi)).toBe(true);
    expect(isEqual(/test/, /test/g)).toBe(false);

    // Map
    const m1 = new Map([['a', 1]]);
    const m2 = new Map([['a', 1]]);
    expect(isEqual(m1, m2)).toBe(true);

    // Set
    const s1 = new Set([1, 2, 3]);
    const s2 = new Set([3, 2, 1]);
    expect(isEqual(s1, s2)).toBe(true); // Set 不考虑顺序
  });

  // 循环引用比较
  test('circular references', () => {
    const objA: any = { a: 1 };
    objA.self = objA;
    const objB: any = { a: 1 };
    objB.self = objB;
    expect(isEqual(objA, objB)).toBe(true);
  });

  // 类型化数组比较
  test('typed arrays', () => {
    const a1 = new Uint8Array([1, 2, 3]);
    const a2 = new Uint8Array([1, 2, 3]);
    expect(isEqual(a1, a2)).toBe(true);
  });

  // 原型链比较
  test('prototypes', () => {
    class A {
      x = 1;
    }
    class B {
      x = 1;
    }
    expect(isEqual(new A(), new B())).toBe(false);
  });

  // 边界情况
  test('edge cases', () => {
    // 空值比较
    expect(isEqual(null, undefined)).toBe(false);
    expect(isEqual({}, Object.create(null))).toBe(false);

    // Symbol 属性
    const sym = Symbol();
    expect(isEqual({ [sym]: 1 }, { [sym]: 1 })).toBe(true);
  });

  test('数组内对象属性不相等', () => {
    const arr1 = [{ id: 1 }, { id: 2 }];
    const arr2 = [{ id: 1 }, { id: 3 }];
    expect(isEqual(arr1, arr2)).toBe(false);
  });

  test('稀疏数组比较', () => {
    const arr1 = new Array(3);
    arr1[1] = { data: 1 };
    const arr2 = new Array(3);
    arr2[1] = { data: 2 };
    expect(isEqual(arr1, arr2)).toBe(false);
  });

  test('带额外属性的数组', () => {
    const arr1: any = [1, 2];
    arr1.test = 'a';
    const arr2: any = [1, 2];
    arr2.test = 'b';
    expect(isEqual(arr1, arr2)).toBe(false);
  });

  test('原始值不缓存', () => {
    const a = 42;
    const b = 42;
    // 验证不会出现 WeakMap 类型错误
    expect(() => isEqual(a, b)).not.toThrow();
  });
});
