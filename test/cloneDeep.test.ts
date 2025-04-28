import { cloneDeep } from '../src/cloneDeep';

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
  test('perf', () => {
    // 测试用例：100万级数据
    // const data = {
    //   arr: new Float64Array(1e5).map(() => Math.random()),
    //   map: new Map([...Array(1e3)].map((_, i) => [i, { id: i }])),
    //   nested: [...Array(1000)].map(() => ({
    //     child: {
    //       set: new Set([1, 2, 3]),
    //       buf: new ArrayBuffer(1024)
    //     }
    //   }))
    // };
    // // 测试结果
    // console.time('cloneDeep');
    // const cloned = cloneDeep(data);
    // console.timeEnd('cloneDeep'); // ~120ms (Chrome 115)
    // console.time('isEqual');
    // console.log(isEqual(data, cloned)); // true
    // console.timeEnd('isEqual'); // ~85ms (Chrome 115)
    // console.log('is Same: ', Object.is(data, cloned));
  });
});
