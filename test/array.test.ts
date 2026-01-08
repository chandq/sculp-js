import { arrayLike } from '../src/type';
import { arrayEach, arrayEachAsync, arrayInsertBefore, arrayRemove, diffArray } from '../src/array';
import { wait } from '../src/async';
import './utils';

test('arrayLike', () => {
  expect(arrayLike([])).toBe(true);
  expect(arrayLike('')).toBe(true);
  expect(arrayLike(1)).toBe(false);
  expect(arrayLike({ length: 1 })).toBe(true);
  expect(arrayLike({ size: 1 })).toBe(false);
});

test('arrayEach 标准数组', () => {
  const arr = ['a', 'b', 'c', 'd'];
  const list: Array<number> = [];
  const map = new Map();

  arrayEach(arr, (val, idx) => {
    if (val === 'c') return false;

    list.push(idx);
    map.set(val, true);
  });

  expect(list.length).toBe(2);
  expect(list[0]).toBe(0);
  expect(list[1]).toBe(1);
  expect(map.size).toBe(2);
  expect(map.get('a')).toBe(true);
  expect(map.get('b')).toBe(true);
});

test('arrayEach 倒序', () => {
  const arr1 = ['a', 'b', 'c', 'd'];
  const arr2: string[] = [];
  const arr3: string[] = [];
  const arr4: string[] = [];

  arrayEach(
    arr1,
    el => {
      if (el === 'c') return false;

      arr2.push(el);
    },
    true
  );
  expect(arr2).toEqual(['d']);

  arrayEach(
    arr1,
    el => {
      arr3.push(el);
    },
    true
  );
  expect(arr1.slice().reverse()).toEqual(arr3);

  arrayEach(arr1, el => {
    if (el === 'c') return true;

    arr4.push(el);
  });
  expect(arr4).toEqual(['a', 'b', 'd']);
});

interface ArrayLikeItem {
  a: number;
}
test('arrayEach 类数组', () => {
  const arr: ArrayLike<ArrayLikeItem> = {
    0: { a: 1 },
    1: { a: 2 },
    length: 2
  };
  const list: number[] = [];
  arrayEach(arr, (val, idx) => {
    list.push(val.a);
  });
  expect(list.length).toBe(2);
  expect(list[0]).toBe(1);
  expect(list[1]).toBe(2);
});

test('arrayEachAsync', async () => {
  const events: number[] = [];
  await arrayEachAsync([1, 2, 3, 4], async it => {
    await wait();
    events.push(it);

    if (it === 2) return false;
  });
  // [1,2,5]
  events.push(5);
  expect(events).toEqual([1, 2, 5]);

  await arrayEachAsync(
    [1, 2, 3, 4],
    async it => {
      await wait();
      events.push(it);

      if (it === 2) return false;
    },
    true
  );
  // [1,2,5,4,3,2,5]
  events.push(5);
  expect(events).toEqual([1, 2, 5, 4, 3, 2, 5]);
});

test('arrayInsertBefore', () => {
  const arr = ['a', 'b', 'c', 'd'];

  arrayInsertBefore(arr, 0, 0);
  expect(arr).toEqual(['a', 'b', 'c', 'd']);

  arrayInsertBefore(arr, 0, 1);
  expect(arr).toEqual(['a', 'b', 'c', 'd']);

  arrayInsertBefore(arr, 0, 3);
  expect(arr).toEqual(['b', 'c', 'a', 'd']);

  arrayInsertBefore(arr, 3, 1);
  expect(arr).toEqual(['b', 'd', 'c', 'a']);
});

test('arrayRemove', () => {
  const arr1 = ['a', 'b', 'c', 'd'];
  const arr2 = arrayRemove(arr1, val => val === 'a' || val === 'c');
  expect(arr1).toBe(arr2);
  expect(arr1).toEqual(['b', 'd']);

  // const len = 1e5;
  // const arr = new Array(len).fill('');

  // function arrayEach2(array, iterator, reverse = false) {
  //   if (reverse) {
  //     for (let idx = array.length - 1; idx >= 0; idx--) {
  //       const val = array[idx];
  //       const re = iterator(val, idx, array);
  //       if (re === false) break;
  //       else if (re === true) continue;
  //     }
  //   } else {
  //     for (let idx = 0, len = array.length; idx < len; idx++) {
  //       const val = array[idx];
  //       const re = iterator(val, idx, array);
  //       if (re === false) break;
  //       else if (re === true) continue;
  //     }
  //   }
  // }

  // function myEach(arr, fn) {
  //   for (let index = 0; index < arr.length; index++) {
  //     fn(arr[index]);
  //   }
  // }

  // console.time('forEach');
  // arr.forEach(val => {
  //   const el = val;
  // });
  // console.timeEnd('forEach');

  // console.time('sculp');
  // arrayEach(arr, val => {
  //   const el = val;
  // });
  // console.timeEnd('sculp');

  // console.time('sculp-n');
  // arrayEach2(arr, val => {
  //   const el = val;
  // });
  // console.timeEnd('sculp-n');

  // console.time('for');
  // for (let index = 0; index < len; index++) {
  //   const el = arr[index];
  // }
  // console.timeEnd('for');

  // console.time('myEach');
  // myEach(arr, val => {
  //   const el = val;
  // });
  // console.timeEnd('myEach');
});

describe('diffArray (getKey optional)', () => {
  test('diff number array without getKey', () => {
    const result = diffArray([1, 2, 3], [2, 3, 4]);

    expect(result).toEqual({
      added: [4],
      removed: [1]
    });
  });

  test('diff string array without getKey', () => {
    const result = diffArray(['a', 'b'], ['b', 'c']);

    expect(result).toEqual({
      added: ['c'],
      removed: ['a']
    });
  });

  test('diff symbol array without getKey', () => {
    const a = Symbol('a');
    const b = Symbol('b');
    const c = Symbol('c');

    const result = diffArray([a, b], [b, c]);

    expect(result).toEqual({
      added: [c],
      removed: [a]
    });
  });

  test('diff object array with getKey', () => {
    const source = [{ id: 1 }, { id: 2 }];
    const target = [{ id: 2 }, { id: 3 }];

    const result = diffArray(source, target, item => item.id);

    expect(result.added).toEqual([{ id: 3 }]);
    expect(result.removed).toEqual([{ id: 1 }]);
  });

  test('return empty diff for equal arrays', () => {
    const result = diffArray([1, 2], [1, 2]);

    expect(result).toEqual({
      added: [],
      removed: []
    });
  });

  test('handle empty source array', () => {
    const result = diffArray([], [1, 2]);

    expect(result).toEqual({
      added: [1, 2],
      removed: []
    });
  });

  test('handle empty target array', () => {
    const result = diffArray([1, 2], []);

    expect(result).toEqual({
      added: [],
      removed: [1, 2]
    });
  });

  test('throw error when object array without getKey', () => {
    expect(() => diffArray([{ id: 1 }], [{ id: 2 }])).toThrow(
      'diffArray: getKey is required when item is not a primitive value'
    );
  });

  test('should not mutate input arrays', () => {
    const source = [1];
    const target = [2];

    diffArray(source, target);

    expect(source).toEqual([1]);
    expect(target).toEqual([2]);
  });
});
