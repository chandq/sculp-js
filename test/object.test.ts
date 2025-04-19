import { wait } from '../src/async';
import {
  objectAssign,
  objectEach,
  isPlainObject,
  objectFill,
  objectGet,
  objectEachAsync,
  objectMap,
  objectPick,
  objectOmit,
  cloneDeep,
  isEqual
} from '../src/object';
import { objectHas, AnyObject, isNumber } from '../src/type';

test('isPlainObject', () => {
  expect(isPlainObject([])).toBe(false);
  expect(isPlainObject(Object.create(null))).toBe(true);
  expect(isPlainObject({})).toBe(true);
  class Object2 extends Object {}
  expect(isPlainObject(new Object2())).toBe(false);
});

test('objectHas', () => {
  const o = {
    a: 1
  };

  expect(objectHas(o, 'a')).toBe(true);
  expect(objectHas(o, 'b' as any)).toBe(false);
  expect(objectHas(o, 'toString' as any)).toBe(false);
});

test('objectEach', () => {
  const o = { a: 1, b: 2, c: 3 };
  const keys: Array<keyof typeof o> = [];

  objectEach(o, (v, k) => {
    if (k === 'b') return false;
    keys.push(k);
  });

  expect(keys.includes('b')).toBeFalsy();
});

test('objectEachAsync', async () => {
  const o = { a: 1, b: 2, c: 3 };
  const keys: Array<keyof typeof o> = [];

  await objectEachAsync(o, async (v, k) => {
    if (k === 'b') return false;
    await wait();
    keys.push(k);
  });

  expect(keys.includes('b')).toBeFalsy();
});

test('objectMap', () => {
  const o1 = { a: 1, b: 2, c: 3 };
  const o2 = objectMap(o1, (v, k) => v * 2);
  expect(o2).toEqual({ a: 2, b: 4, c: 6 });
  expect(o2).not.toBe(o1);
});

test('objectPick', () => {
  const o1 = { a: 1, b: 2, c: 3 };
  const o2 = objectPick(o1, ['a', 'b']);
  expect(Object.keys(o2)).toHaveLength(2);
  expect(o2.a).toBe(1);
  expect(o2.b).toBe(2);
});

test('objectOmit', () => {
  const o1 = { a: 1, b: 2, c: 3 };
  const o2 = objectOmit(o1, ['a', 'b']);
  expect(Object.keys(o2)).toHaveLength(1);
  expect(o2.c).toBe(3);
});

interface ObjectTest1 {
  a: number;
  b: number;
  c: number;
  d: number;
}
test('objectAssign: 1 层', () => {
  const source = { a: 1, b: 2, c: 3 };
  const target = { b: 22, d: 44 };
  const result = objectAssign<ObjectTest1>(source, target, undefined);

  // console.log(result);
  expect(result).toBe(source);
  expect(result.a).toBe(1);
  expect(result.b).toBe(22);
  expect(result.c).toBe(3);
  expect(result.d).toBe(44);
});

interface ObjectTest2 {
  a: number;
  b: number;
  c: {
    c1: number;
    c2: number;
    c3: number;
  };
  d: number;
  e: {
    f: number;
  };
}
test('objectAssign: 2 层', () => {
  const source = { a: 1, b: 2, c: { c1: 3, c2: 4 } };
  const target = { b: 22, c: { c2: 32, c3: 35 }, d: 44, e: { f: 5 } };
  const result = objectAssign<ObjectTest2>(source, target);

  // console.log(result);
  expect(result).toBe(source);
  expect(result.a).toBe(1);
  expect(result.b).toBe(22);
  expect(result.c.c1).toBe(3);
  expect(result.c.c2).toBe(32);
  expect(result.c.c3).toBe(35);
  expect(result.d).toBe(44);
  expect(result.e).not.toBe(target.e);
  expect(result.e.f).toBe(5);
});

interface ObjectTest3 {
  a: number;
  b: number;
  c: number;
}
test('objectAssign: 多个', () => {
  const o1 = { a: 1 };
  const o2 = { b: 2 };
  const o3 = { c: 3 };
  const o4 = objectAssign<ObjectTest3>(o1, o2, o3, undefined);

  expect(o4).toBe(o1);
  expect(o4.a).toBe(1);
  expect(o4.b).toBe(2);
  expect(o4.c).toBe(3);
});

type ObjectTest4 = Array<number | string>;
test('objectAssign 数组', () => {
  const a1 = [1, 2, 3];
  const a2 = ['a', 'b', 'c'];
  const a3 = ['x', 'y', 'z', 'o'];
  const a4 = objectAssign<ObjectTest4>(a1, a2, a3);

  expect(a4[0]).toBe('x');
  expect(a4[1]).toBe('y');
  expect(a4[2]).toBe('z');
  expect(a4[3]).toBe('o');
});

interface ObjectTest5 {
  a: string[];
  b: string[][];
  c: {
    d: string;
  }[];
}
test('objectAssign 对象 + 数组', () => {
  const a1 = { a: [1, 2, 3], b: [['www']] };
  const a2 = { a: ['a', 'b', 'c'], c: [{ d: 'd' }] };
  const a3 = { a: ['x', 'y', 'z', 'o'] };
  const a4 = objectAssign<ObjectTest5>(a1, a2, a3);

  // console.log(a4);
  expect(a4.a[0]).toBe('x');
  expect(a4.a[1]).toBe('y');
  expect(a4.a[2]).toBe('z');
  expect(a4.a[3]).toBe('o');
  expect(a4.b).toBe(a1.b);
  expect(a4.c).not.toBe(a2.c);
});

interface ObjectTest6 {
  a: number;
  b: number;
  c: ObjectTest6;
  d: {
    a: number;
    b: number;
    f: string;
    d: ObjectTest6['d'];
  };
  e: string;
  f: string;
}
test('objectAssign 对象循环引用', () => {
  const o1: AnyObject = { a: 1, b: 2, e: 'e' };
  o1.c = o1;
  const o2: AnyObject = { a: 11, b: 22, f: 'f' };
  o2.d = o2;
  const o3 = objectAssign<ObjectTest6>(o1, o2);

  // console.log(o3);
  expect(o3.a).toBe(11);
  expect(o3.b).toBe(22);
  expect(o3.c).toBe(o1.c);
  expect(o3.d).not.toBe(o2.d);
  expect(o3.d.a).toBe(11);
  expect(o3.d.b).toBe(22);
  expect(o3.d.d).toBe(o3.d);
  expect(o3.d.d).not.toBe(o2.d);
  expect(o3.e).toBe('e');
  expect(o3.f).toBe('f');
});

interface ObjectTest7 {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  a: [number, number, ObjectTest7['a']];
}

test('objectAssign 数组循环引用', () => {
  const o1 = { a: [1, 2] };
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  o1.a[2] = o1.a;
  const o2 = { a: [11, 2] };
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  o2.a[2] = o2.a;
  const o3 = objectAssign<ObjectTest7>(o1, o2);

  // console.log(o3);
  expect(o3.a).toBe(o1.a);
  expect(o3.a).not.toBe(o2.a);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  expect(o3.a[0]).toBe(11);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  expect(o3.a[1]).toBe(2);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  expect(o3.a[2]).toBe(o1.a);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  expect(o3.a[2]).not.toBe(o2.a);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  expect(o3.a[2][0]).toBe(11);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  expect(o3.a[2][1]).toBe(2);
});

test('objectAssign 非纯对象直接', () => {
  const oa = { x: 11, y: 22, z: 33, w: 44 };
  const Ob = function () {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    this.x = 1;
  };
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  Ob.prototype.y = 2;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const ob = new Ob();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  ob.z = 3;
  Object.defineProperty(ob, 'w', {
    enumerable: false,
    value: 4
  });

  const oc = objectAssign({}, oa, ob);
  expect(oc).toBe(ob);
});

test('objectAssign 非纯对象包含', () => {
  const oa = { x: 11, y: 22, z: 33, w: 44 };
  const Ob = function () {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    this.x = 1;
  };
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  Ob.prototype.y = 2;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const ob = new Ob();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  ob.z = 3;
  Object.defineProperty(ob, 'w', {
    enumerable: false,
    value: 4
  });

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const ob2 = new Ob();

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const oc = objectAssign({ x: 1 }, { x: oa }, { x: ob }, { x: ob2 });
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  expect(oc.x).toBe(ob2);
});

interface ObjectApplyTest {
  a: number;
  b: number;
  c: number;
  d: number | null;
}
test('objectFill: 默认填充规则', () => {
  const o1: Partial<ObjectApplyTest> = { a: 1, b: 2, c: undefined, d: null };
  const o2: Partial<ObjectApplyTest> = { b: 4, c: 5, d: 6 };
  const o = objectFill<ObjectApplyTest>(o1, o2);

  // console.log(o);
  expect(o.a).toBe(1);
  expect(o.b).toBe(2);
  expect(o.c).toBe(5);
  expect(o.d).toBe(null);
});

test('objectFill: 自定填充规则', () => {
  const o1: Partial<ObjectApplyTest> = { a: 1, b: 2, c: undefined, d: null };
  const o2: Partial<ObjectApplyTest> = { b: 4, c: 5, d: 6 };
  const o = objectFill<ObjectApplyTest>(o1, o2, (source, target, key) => {
    if (isNumber(source[key])) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return source[key] < 3;
    }
    return true;
  });

  // console.log(o);
  expect(o.a).toBe(1);
  expect(o.b).toBe(4);
  expect(o.c).toBe(5);
  expect(o.d).toBe(6);
});

test('objectGet', () => {
  const o = {
    a: {
      b: {
        c: 1
      },
      d: [
        {
          e: [2]
        }
      ]
    }
  };

  expect(objectGet(o, 'a.b.c').p).toBe(o.a.b);
  expect(objectGet(o, 'a.b.c').k).toBe('c');
  expect(objectGet(o, 'a.b.c').v).toBe(o.a.b.c);

  expect(objectGet(o, 'a.d[0].e.0').p).toBe(o.a.d[0].e);
  expect(objectGet(o, 'a.d[0].e.0').k).toBe('0');
  expect(objectGet(o, 'a.d[0].e.0').v).toBe(o.a.d[0].e[0]);

  expect(objectGet(o, 'a.d[0].f.0').p).toBeUndefined();
  expect(objectGet(o, 'a.d[0].f.0').k).toBeUndefined();
  expect(objectGet(o, 'a.d[0].f.0').v).toBeUndefined();

  expect(() => objectGet(o, 'a.d[0].f.0', true)).toThrow('[Object] objectGet path 路径不正确');

  const object2 = { a: [{ b: { c: 3 } }, 4] };
  //@ts-ignore
  expect(objectGet(object2, 'a[0].b.c').p).toBe(object2.a[0].b);
  expect(objectGet(object2, 'a[0].b.c').k).toBe('c');
  expect(objectGet(object2, 'a[0].b.c').v).toBe(3);

  expect(objectGet(object2, 'a[1].b.c').p).toBeUndefined();
  expect(objectGet(object2, 'a[1].b.c').k).toBeUndefined();
  expect(objectGet(object2, 'a[1].b.c').v).toBeUndefined();
});

describe('cloneDeep', () => {
  // 测试原始类型
  test('primitive values', () => {
    expect(cloneDeep(42)).toBe(42);
    expect(cloneDeep('hello')).toBe('hello');
    expect(cloneDeep(true)).toBe(true);
    expect(cloneDeep(null)).toBeNull();
    expect(cloneDeep(undefined)).toBeUndefined();
    const sym = Symbol('test');
    expect(cloneDeep(sym)).toBe(sym); // Symbol 直接返回引用
  });

  // 测试 Date 对象
  test('Date', () => {
    const date = new Date('2023-10-01');
    const clonedDate = cloneDeep(date);
    expect(clonedDate).toEqual(date);
    expect(clonedDate).not.toBe(date);
    expect(clonedDate.getTime()).toBe(date.getTime());
  });

  // 测试 RegExp 对象
  test('RegExp', () => {
    const regex = /test/gi;
    const clonedRegex = cloneDeep(regex);
    expect(clonedRegex.source).toBe(regex.source);
    expect(clonedRegex.flags).toBe(regex.flags);
    expect(clonedRegex).not.toBe(regex);
  });

  // 测试数组
  test('Array', () => {
    const arr = [1, { a: 2 }, [3]];
    const clonedArr = cloneDeep(arr);
    expect(clonedArr).toEqual(arr);
    expect(clonedArr).not.toBe(arr);
    expect(clonedArr[1]).not.toBe(arr[1]); // 深度校验
  });

  // 测试普通对象
  test('Object', () => {
    const obj = { a: 1, b: { c: 2 } };
    const clonedObj = cloneDeep(obj);
    expect(clonedObj).toEqual(obj);
    expect(clonedObj).not.toBe(obj);
    expect(clonedObj.b).not.toBe(obj.b);
  });
  //对象属性深度克隆验证
  test('nested object cloning', () => {
    const original = {
      a: 1,
      b: {
        c: [2, { d: 3 }]
      }
    };

    const cloned = cloneDeep(original);

    // 验证层级结构
    expect(cloned).toEqual(original);

    // 验证无引用共享
    expect(cloned.b).not.toBe(original.b);
    expect(cloned.b.c).not.toBe(original.b.c);
    expect(cloned.b.c[1]).not.toBe(original.b.c[1]);

    // 修改克隆对象不影响原始对象
    cloned.b.c[1].d = 4;
    expect(original.b.c[1].d).toBe(3);
  });
  //循环引用处理验证
  test('circular reference cloning', () => {
    const obj: any = { name: 'root' };
    obj.self = obj;
    obj.children = [{ parent: obj }];

    const cloned = cloneDeep(obj);

    // 验证循环引用
    expect(cloned.self).toBe(cloned);
    expect(cloned.children[0].parent).toBe(cloned);

    // 验证数据独立性
    cloned.name = 'cloned';
    expect(obj.name).toBe('root');
  });

  // 测试 Symbol 键的对象
  test('Object with Symbol keys', () => {
    const key = Symbol('secret');
    const obj = { [key]: 'value' };
    const clonedObj = cloneDeep(obj);
    expect(clonedObj[key]).toBe('value');
    expect(Object.getOwnPropertySymbols(clonedObj)).toEqual([key]);
  });

  // 测试 Map
  test('Map', () => {
    const map = new Map().set('key', { value: 42 });
    const clonedMap = cloneDeep(map);
    expect(clonedMap).toBeInstanceOf(Map);
    expect(clonedMap.get('key')).toEqual({ value: 42 });
    expect(clonedMap.get('key')).not.toBe(map.get('key')); // 深度校验
  });

  // 测试 Set
  test('Set', () => {
    const set = new Set().add({ item: 42 });
    const clonedSet = cloneDeep(set);
    expect(clonedSet).toBeInstanceOf(Set);
    expect([...clonedSet][0]).toEqual({ item: 42 });
    expect([...clonedSet][0]).not.toBe([...set][0]); // 深度校验
  });

  // 测试 ArrayBuffer
  test('ArrayBuffer', () => {
    const buffer = new Uint8Array([1, 2, 3]).buffer;
    const clonedBuffer = cloneDeep(buffer);
    expect(clonedBuffer).toBeInstanceOf(ArrayBuffer);
    expect(new Uint8Array(clonedBuffer)).toEqual(new Uint8Array(buffer));
    expect(clonedBuffer).not.toBe(buffer);
  });

  //特殊数组类型验证
  test('typed array cloning', () => {
    const source = new Float32Array([1.1, 2.2, 3.3]);
    const cloned = cloneDeep(source);

    // 验证类型保持
    expect(cloned).toBeInstanceOf(Float32Array);

    // 验证数据独立性
    cloned[0] = 9.9;
    expect(source[0]).toBeCloseTo(1.1);
  });
  //访问器属性处理验证
  test('object with accessors', () => {
    const original = {
      _value: 0,
      get value() {
        return this._value;
      },
      set value(v) {
        this._value = v;
      }
    };

    const cloned = cloneDeep(original);

    // 验证访问器功能
    cloned.value = 5;
    expect(cloned.value).toBe(5);
    expect(original.value).toBe(0);

    // 验证引用独立性
    expect(cloned.value).not.toBe(original.value);
  });
  // 测试原型链继承
  test('prototype chain', () => {
    class CustomClass {
      public prop = 123;
    }
    const instance = new CustomClass();
    const clonedInstance = cloneDeep(instance);
    expect(clonedInstance).toBeInstanceOf(CustomClass);
    expect(clonedInstance.prop).toBe(123);
  });

  // 测试循环引用
  test('circular reference', () => {
    const obj: any = { a: 1 };
    obj.self = obj;
    const clonedObj = cloneDeep(obj);
    expect(clonedObj.self).toBe(clonedObj); // 指向克隆后的对象
    expect(clonedObj.self).not.toBe(obj); // 不是原对象
  });

  // 测试函数直接引用（不克隆）
  test('function', () => {
    const func = () => console.log('test');
    const clonedFunc = cloneDeep(func);
    expect(clonedFunc).toBe(func); // 函数返回原引用
  });

  // 测试混合复杂结构
  test('complex nested structure', () => {
    const data = {
      date: new Date(),
      map: new Map().set('nested', [new Set([{ a: 42 }])]),
      buffer: new ArrayBuffer(8)
    };
    const clonedData = cloneDeep(data);
    expect(clonedData.date).toEqual(data.date);
    expect(clonedData.map).toBeInstanceOf(Map);
    expect([...clonedData.map.get('nested')][0]).toBeInstanceOf(Set);
    expect(clonedData.buffer).not.toBe(data.buffer);
  });
});

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
