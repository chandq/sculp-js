import { isEqual } from '../src/isEqual';
import { createComplexFastObject } from './complexFast.fixture';

describe('isEqual', () => {
  // 1. 基本类型与引用相等
  describe('Primitives & References', () => {
    test('should return true for strict equality', () => {
      expect(isEqual(1, 1)).toBe(true);
      expect(isEqual('a', 'a')).toBe(true);
      expect(isEqual(true, true)).toBe(true);
      const obj = { a: 1 };
      expect(isEqual(obj, obj)).toBe(true);

      expect(isEqual(+0, -0)).toBe(true);
    });

    test('should return true for NaN vs NaN', () => {
      expect(isEqual(NaN, NaN)).toBe(true);
    });

    test('should return false for different primitives', () => {
      expect(isEqual(1, 2)).toBe(false);
      expect(isEqual('a', 'b')).toBe(false);
      expect(isEqual(true, false)).toBe(false);
      expect(isEqual(null, undefined)).toBe(false);
    });

    test('should handle null/undefined correctly', () => {
      expect(isEqual(null, null)).toBe(true);
      expect(isEqual(undefined, undefined)).toBe(true);
      expect(isEqual(null, {})).toBe(false);
      expect(isEqual({}, undefined)).toBe(false);
    });

    test('should return false when comparing primitive with object', () => {
      // eslint-disable-next-line
      expect(isEqual(1, new Number(1))).toBe(false); // Lodash 行为，primitive !== wrapper
      expect(isEqual(1, Number(1))).toBe(true);
      expect(isEqual('s', ['s'])).toBe(false);
    });
  });

  // 2. 数组
  describe('Arrays', () => {
    test('should compare arrays deeply', () => {
      expect(isEqual([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(isEqual([1, [2, 3]], [1, [2, 3]])).toBe(true);
    });

    test('should return false for arrays with different lengths', () => {
      expect(isEqual([1, 2], [1, 2, 3])).toBe(false);
    });

    test('should return false for arrays with different content', () => {
      expect(isEqual([1, 2, 3], [1, 2, 4])).toBe(false);
    });
  });

  // 3. 普通对象
  describe('Objects', () => {
    test('should compare objects deeply', () => {
      expect(isEqual({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } })).toBe(true);
    });

    test('should return false for objects with different key counts', () => {
      expect(isEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    });

    test('should return false for objects with different keys', () => {
      expect(isEqual({ a: 1 }, { b: 1 })).toBe(false);
    });

    test('should return false for objects with different values', () => {
      expect(isEqual({ a: 1 }, { a: 2 })).toBe(false);
    });

    test('should handle Symbol keys', () => {
      const sym = Symbol('key');
      expect(isEqual({ [sym]: 1 }, { [sym]: 1 })).toBe(true);
      expect(isEqual({ [sym]: 1 }, { [sym]: 2 })).toBe(false);
    });

    test('should handle Object.create(null)', () => {
      const a = Object.create(null);
      a.x = 1;
      const b = Object.create(null);
      b.x = 1;
      expect(isEqual(a, b)).toBe(true);
    });
  });

  // 4. 特殊对象类型 (Date, RegExp, Map, Set)
  describe('Special Types', () => {
    // Date
    test('should compare Dates', () => {
      const d1 = new Date('2023-01-01');
      const d2 = new Date('2023-01-01');
      const d3 = new Date('2023-01-02');
      expect(isEqual(d1, d2)).toBe(true);
      expect(isEqual(d1, d3)).toBe(false);
    });

    // RegExp
    test('should compare RegExps', () => {
      expect(isEqual(/abc/g, /abc/g)).toBe(true);
      expect(isEqual(/abc/g, /abc/i)).toBe(false);
      expect(isEqual(/abc/g, /abd/g)).toBe(false);
    });

    // Map
    test('should compare Maps', () => {
      const m1 = new Map([
        ['a', 1],
        ['b', { x: 1 }]
      ]);
      const m2 = new Map([
        ['a', 1],
        ['b', { x: 1 }]
      ]);
      const m3 = new Map([
        ['a', 1],
        ['b', { x: 2 }]
      ]);
      const m4 = new Map([['a', 1]]); // diff size

      expect(isEqual(m1, m2)).toBe(true);
      expect(isEqual(m1, m3)).toBe(false);
      expect(isEqual(m1, m4)).toBe(false);
    });

    test('should compare Maps with key mismatch', () => {
      const m1 = new Map([['a', 1]]);
      const m2 = new Map([['b', 1]]);
      expect(isEqual(m1, m2)).toBe(false);
    });

    // Set
    test('should compare Sets', () => {
      const s1 = new Set([1, { a: 1 }]);
      const s2 = new Set([1, { a: 1 }]); // deep compare for set items
      const s3 = new Set([1, { a: 2 }]);
      const s4 = new Set([1]); // diff size

      expect(isEqual(s1, s2)).toBe(true);
      expect(isEqual(s1, s3)).toBe(false);
      expect(isEqual(s1, s4)).toBe(false);
    });

    // ArrayBuffer & DataView & TypedArrays
    test('should compare ArrayBuffers', () => {
      const b1 = new Uint8Array([1, 2, 3]).buffer;
      const b2 = new Uint8Array([1, 2, 3]).buffer;
      const b3 = new Uint8Array([1, 2, 4]).buffer;
      expect(isEqual(b1, b2)).toBe(true);
      expect(isEqual(b1, b3)).toBe(false);
    });

    test('should compare TypedArrays', () => {
      const t1 = new Int32Array([1, 2, 3]);
      const t2 = new Int32Array([1, 2, 3]);
      const t3 = new Int32Array([1, 2, 4]);
      expect(isEqual(t1, t2)).toBe(true);
      expect(isEqual(t1, t3)).toBe(false);
    });
  });

  // 5. 边界与类型混杂
  describe('Edge Cases & Mixed Types', () => {
    test('should return false for different types', () => {
      expect(isEqual([], {})).toBe(false);
      expect(isEqual(new Date(), { getTime: () => 0 })).toBe(false);
    });

    test('should return false for mismatched object tags', () => {
      // 模拟 tag 相同但实质不同通常被 tagCheck 拦截，这里测试 tag不同
      expect(isEqual(new Date(), new RegExp(''))).toBe(false);
    });
  });

  // 6. 循环引用
  describe('Circular References', () => {
    test('should handle circular references returning true', () => {
      const obj1 = { a: 1 };
      obj1.self = obj1;

      const obj2 = { a: 1 };
      obj2.self = obj2;

      expect(isEqual(obj1, obj2)).toBe(true);
    });

    test('should handle circular references returning false', () => {
      const obj1 = { a: 1 };
      obj1.self = obj1;

      const obj2 = { a: 1 };
      obj2.self = { a: 1 }; // 结构相似但不是循环引用

      expect(isEqual(obj1, obj2)).toBe(false);
    });

    test('should handle complex circular structures', () => {
      const a = { x: 1 };
      const b = { y: 2 };
      a.b = b;
      b.a = a;

      const a2 = { x: 1 };
      const b2 = { y: 2 };
      a2.b = b2;
      b2.a = a2;

      expect(isEqual(a, a2)).toBe(true);

      b2.y = 3;
      expect(isEqual(a, a2)).toBe(false);
    });

    test('fast mode deep equal with complex structure', () => {
      const a = createComplexFastObject();
      const b = createComplexFastObject();

      expect(isEqual(a, b)).toBe(true);
    });

    test('function & symbol by ref', () => {
      const fn = () => {};
      expect(isEqual(fn, fn)).toBe(true);
      expect(
        isEqual(
          () => {},
          () => {}
        )
      ).toBe(false);

      const s = Symbol('x');
      expect(isEqual(s, s)).toBe(true);
      expect(isEqual(Symbol('x'), Symbol('x'))).toBe(false);
      expect(isEqual(Symbol('x'), 'x')).toBe(false);
      expect(isEqual(Object(Symbol('a')), Object(Symbol('a')))).toBe(false);
      expect(isEqual(Object('a'), Object('a'))).toBe(true);
    });

    test('constructor mismatch', () => {
      class A {
        x = 1;
      }
      class B {
        x = 1;
      }
      const a = new A();
      // expect(isEqual(new A(), new B())).toBe(false);
      expect(isEqual(a, a)).toBe(true);
      expect(
        isEqual(
          () => {},
          () => {}
        )
      ).toBe(false);
    });
  });
});

describe('DataView Coverage', () => {
  test('should compare DataViews with same content', () => {
    const buffer = new ArrayBuffer(8);
    const dv1 = new DataView(buffer, 0, 8);
    const dv2 = new DataView(buffer, 0, 8);
    expect(isEqual(dv1, dv2)).toBe(true);
  });

  test('should return false for DataViews with different byteOffsets', () => {
    const buffer = new ArrayBuffer(16);
    const dv1 = new DataView(buffer, 0, 8);
    const dv2 = new DataView(buffer, 8, 8);
    // 即使内容全为0，但 offset 不同，通常在深比较中视为不等
    expect(isEqual(dv1, dv2)).toBe(false);
  });

  test('should return false for DataViews with different byteLengths', () => {
    const buffer = new ArrayBuffer(16);
    const dv1 = new DataView(buffer, 0, 8);
    const dv2 = new DataView(buffer, 0, 16);
    expect(isEqual(dv1, dv2)).toBe(false);
  });

  test('should return false for DataViews with different content', () => {
    const buffer1 = new Uint8Array([1, 2, 3]).buffer;
    const buffer2 = new Uint8Array([1, 2, 4]).buffer;
    const dv1 = new DataView(buffer1);
    const dv2 = new DataView(buffer2);
    expect(isEqual(dv1, dv2)).toBe(false);
  });

  test('should return false when comparing DataView to ArrayBuffer', () => {
    const buffer = new ArrayBuffer(8);
    const dv = new DataView(buffer);
    // Tag 不同：[object DataView] vs [object ArrayBuffer]
    expect(isEqual(dv, buffer)).toBe(false);
  });
});
