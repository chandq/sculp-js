import { cloneDeep } from '../src/object';
import { formatTree, searchTreeById, forEachDeep, buildTree, forEachMap } from '../src/tree';

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

test('buildTree', () => {
  const array = [
    { id: 'node-1', parent: 'root' },
    { id: 'node-2', parent: 'root' },
    { id: 'node-3', parent: 'node-2' },
    { id: 'node-4', parent: 'node-2' },
    { id: 'node-5', parent: 'node-4' }
  ];
  const tree = buildTree('id', 'parent', array);
  expect(tree).toEqual([
    { id: 'node-1', parent: 'root' },
    {
      id: 'node-2',
      parent: 'root',
      children: [
        { id: 'node-3', parent: 'node-2' },
        {
          id: 'node-4',
          parent: 'node-2',
          children: [{ id: 'node-5', parent: 'node-4' }]
        }
      ]
    }
  ]);
});

function generateTreeArray(length) {
  const treeArray: any = [];

  // 创建节点函数
  function createNode(id) {
    return {
      id: id,
      pid: Math.floor(id / 2),
      value: Math.random()
    };
  }

  for (let i = 1; i <= length; i++) {
    const node = createNode(i);
    treeArray.push(node);
  }

  return treeArray;
}

const treeArray = generateTreeArray(10000);

test('compare formatTree buildTree', () => {
  // console.log('arr', arr);
  const arr = cloneDeep(treeArray) as any[];
  const startTime = Date.now();
  const tree1 = buildTree('id', 'pid', arr);
  console.log('buildTree time:', Date.now() - startTime);

  const startTime2 = Date.now();
  const tree2 = formatTree(arr, { keyField: 'id', childField: 'children', pidField: 'pid' });
  console.log('formatTree time:', Date.now() - startTime2);

  expect(tree1).toEqual(tree2);
});

test('forEachDeep: remove tree item', () => {
  const tree = [
    { id: 1, name: 'row1' },
    {
      id: 2,
      name: 'row2',
      children: [{ id: 21, name: 'row2-1' }]
    },
    { id: 3, name: 'row3' }
  ];
  forEachDeep(tree, (item, i, currentArr: any) => {
    if (item.id === 21) {
      currentArr.splice(i, 1);
    }
  });

  expect(tree).toEqual([
    { id: 1, name: 'row1' },
    {
      id: 2,
      name: 'row2',
      children: []
    },
    { id: 3, name: 'row3' }
  ]);
});

test('forEachDeep: insert tree item', () => {
  const tree = [
    { id: 1, name: 'row1' },
    {
      id: 2,
      name: 'row2',
      children: [{ id: 21, name: 'row2-1' }]
    },
    { id: 3, name: 'row3' }
  ];
  forEachDeep(tree, (item, i, currentArr: any) => {
    if (item.id === 21) {
      currentArr.push({ id: 22, name: 'row2-2' }, { id: 23, name: 'row2-3' });
    }
  });

  expect(tree).toEqual([
    { id: 1, name: 'row1' },
    {
      id: 2,
      name: 'row2',
      children: [
        { id: 21, name: 'row2-1' },
        { id: 22, name: 'row2-2' },
        { id: 23, name: 'row2-3' }
      ]
    },
    { id: 3, name: 'row3' }
  ]);
});

test('forEachMap', () => {
  const tree = [
    { id: 1, name: 'row1', age: 1 },
    {
      id: 2,
      name: 'row2',
      age: 2,
      children: [{ id: 21, name: 'row2-1', age: 21 }]
    },
    { id: 3, name: 'row3' }
  ];

  let res1: any[] = [];
  let res2: any[] = [];
  let res3: any[] = [];
  let res4: any[] = [];
  let res5: any[] = [];

  res1 = forEachMap(tree, ({ id, name, children }) => {
    return { key: id, label: name, children };
  });
  expect(res1).toEqual([
    { key: 1, label: 'row1' },
    {
      key: 2,
      label: 'row2',
      children: [{ key: 21, label: 'row2-1' }]
    },
    { key: 3, label: 'row3' }
  ]);

  // reverse traversal
  res2 = forEachMap(
    tree,
    ({ id, name, children }) => {
      return { key: id, label: name, children };
    },
    'children',
    true
  );

  expect(res2).toEqual([
    { key: 3, label: 'row3' },
    {
      key: 2,
      label: 'row2',
      children: [{ key: 21, label: 'row2-1' }]
    },
    { key: 1, label: 'row1' }
  ]);
  // test continue
  res3 = forEachMap(tree, ({ id, name, children }) => {
    if (id === 21) {
      return true;
    }
    return { key: id, label: name, children, job: `job-${id}` };
  });
  expect(res3).toEqual([
    { key: 1, label: 'row1', job: 'job-1' },
    {
      key: 2,
      label: 'row2',
      job: 'job-2',
      children: []
    },
    { key: 3, label: 'row3', job: 'job-3' }
  ]);

  // test break
  res4 = forEachMap(tree, ({ id, name, children }) => {
    if (id === 21) {
      return false;
    }
    return { key: id, label: name, children };
  });
  expect(res4).toEqual([
    { key: 1, label: 'row1' },
    {
      key: 2,
      label: 'row2',
      children: []
    }
  ]);
  // test insert tree item
  res5 = forEachMap(tree, ({ id, name, children }, i, currentArr: any) => {
    if (id === 21) {
      currentArr.push({ id: 22, name: 'row2-2' });
    }
    return { key: id, label: name, children };
  });
  expect(res5).toEqual([
    { key: 1, label: 'row1' },
    {
      key: 2,
      label: 'row2',
      children: [
        { key: 21, label: 'row2-1' },
        { key: 22, label: 'row2-2' }
      ]
    },
    { key: 3, label: 'row3' }
  ]);
});
