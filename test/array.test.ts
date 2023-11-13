import {
  arrayEach,
  arrayEachAsync,
  arrayInsertBefore,
  arrayLike,
  arrayRemove,
  searchTreeById,
  forEachDeep
} from '../src/array';
import { wait } from '../src/async';

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
});

test('searchTreeById', () => {
  const tree = [
    { id: 1, name: 'row1' },
    {
      id: 2,
      name: 'row2',
      children: [{ id: 21, name: 'row2-1' }]
    },
    { id: 3, name: 'row3' }
  ];

  const tree2 = [
    { key: 1, name: 'row1' },
    {
      key: 2,
      name: 'row2',
      child: [{ key: 21, name: 'row2-1' }]
    },
    { key: 3, name: 'row3' }
  ];

  const res1 = searchTreeById(tree, 3);
  const res2 = searchTreeById(tree, 21);
  const res3 = searchTreeById(tree2, 21, { id: 'key', children: 'child' });
  expect(res1).toStrictEqual([[3], [{ id: 3, name: 'row3' }]]);
  expect(res2).toStrictEqual([
    [2, 21],
    [
      {
        id: 2,
        name: 'row2',
        children: [{ id: 21, name: 'row2-1' }]
      },
      { id: 21, name: 'row2-1' }
    ]
  ]);
  expect(res3).toStrictEqual([
    [2, 21],
    [
      {
        key: 2,
        name: 'row2',
        child: [{ key: 21, name: 'row2-1' }]
      },
      { key: 21, name: 'row2-1' }
    ]
  ]);
});

test('forEachDeep', () => {
  const tree = [
    { id: 1, name: 'row1' },
    {
      id: 2,
      name: 'row2',
      children: [{ id: 21, name: 'row2-1' }]
    },
    { id: 3, name: 'row3' }
  ];

  const res1: string[] = [];
  const res2: string[] = [];
  const res3: string[] = [];
  const res4: string[] = [];

  forEachDeep(tree, ({ id, name }) => {
    res1.push(name);
  });
  expect(res1).toEqual(['row1', 'row2', 'row2-1', 'row3']);

  forEachDeep(
    tree,
    ({ id, name }) => {
      res2.push(name);
    },
    'children',
    true
  );
  expect(res2).toEqual(['row1', 'row2-1', 'row2', 'row3'].reverse());

  forEachDeep(tree, ({ id, name }) => {
    if (id === 21) {
      return true;
    }
    res3.push(name);
  });
  expect(res3).toEqual(['row1', 'row2', 'row3']);

  forEachDeep(tree, ({ id, name }) => {
    if (id === 21) {
      return false;
    }
    res4.push(name);
  });
  expect(res4).toEqual(['row1', 'row2']);
});
