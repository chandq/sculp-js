import { AnyObject } from './../src/type';
import { cloneDeep } from '../src/cloneDeep';
import { formatTree, searchTreeById, forEachDeep, mapDeep, fuzzySearchTree, flatTree } from '../src/tree';

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

  forEachDeep(tree, ({ id, name }, i, currentArr, tree, parent, level) => {
    res1.push(name);
    console.log('level', level);
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

export type WithChildren<T> = T & { children?: WithChildren<T>[] };
/**
 * 使用迭代函数转换数组
 * @param {T} array
 * @param {Function} callback 迭代函数
 * @returns {Array}
 */
function flatMap<T, U>(array: T[], callback: (value: T, index: number, array: T[]) => U[]): U[] {
  const result: U[] = [];

  array.forEach((value, index) => {
    result.push(...callback(value, index, array));
  });

  return result;
}

/**
 * 根据 idProp 与 parentIdProp 从对象数组中构建对应的树
 * 当 A[parentIdProp] === B[idProp] 时，对象A会被移动到对象B的children。
 * 当一个对象的 parentIdProp 不与其他对象的 idProp 字段相等时，该对象被作为树的顶层节点
 * @param {string} idProp 元素ID
 * @param {string} parentIdProp 父元素ID
 * @param {object[]} items 一维数组
 * @returns {WithChildren<T>[]} 树
 * @example
 * const array = [
 *   { id: 'node-1', parent: 'root' },
 *   { id: 'node-2', parent: 'root' },
 *   { id: 'node-3', parent: 'node-2' },
 *   { id: 'node-4', parent: 'node-2' },
 *   { id: 'node-5', parent: 'node-4' },
 * ]
 * const tree = buildTree('id', 'parent', array)
 * expect(tree).toEqual([
 *   { id: 'node-1', parent: 'root' },
 *   {
 *     id: 'node-2',
 *     parent: 'root',
 *     children: [
 *       { id: 'node-3', parent: 'node-2' },
 *       {
 *         id: 'node-4',
 *         parent: 'node-2',
 *         children: [{ id: 'node-5', parent: 'node-4' }],
 *       },
 *     ],
 *   },
 * ])
 */
export function buildTree<ID extends string, PID extends string, T extends { [key in ID | PID]: string }>(
  idProp: ID,
  parentIdProp: PID,
  items: T[]
): WithChildren<T>[] {
  type Wrapper = { id: string; children: Wrapper[]; item: T; parent: Wrapper };

  const wrapperMap = new Map<string, Wrapper>();
  const ensure = (id: string) => {
    if (wrapperMap.has(id)) {
      return wrapperMap.get(id);
    }
    //@ts-ignore
    const wrapper: Wrapper = { id, parent: null, item: null, children: [] };
    wrapperMap.set(id, wrapper);
    return wrapper;
  };
  for (const item of items) {
    const parentWrapper = ensure(item[parentIdProp]);
    const itemWrapper = ensure(item[idProp]);
    //@ts-ignore
    itemWrapper.parent = parentWrapper;
    //@ts-ignore
    parentWrapper.children.push(itemWrapper);
    //@ts-ignore
    itemWrapper.item = item;
  }
  const topLevelWrappers = flatMap(
    Array.from(wrapperMap.values()).filter(wrapper => wrapper.parent === null),
    wrapper => wrapper.children
  );

  return unwrapRecursively(topLevelWrappers);

  function unwrapRecursively(wrapperArray: Wrapper[]) {
    const result: WithChildren<T>[] = [];
    for (const wrapper of wrapperArray) {
      if (wrapper.children.length === 0) {
        result.push(wrapper.item);
      } else {
        result.push({
          ...wrapper.item,
          children: unwrapRecursively(wrapper.children)
        });
      }
    }
    return result;
  }
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

test('flatTree', () => {
  const tree = [
    {
      id: 1,
      name: 'root',
      children: [
        { id: 10, name: 'ap-2p', children: [] },
        {
          id: 2,
          name: 'apple',
          children: [
            { id: 20, name: 'ab2p' },
            {
              id: 3,
              name: 'apricot',
              children: [{ id: 5, name: 'butterfly' }]
            },
            {
              id: 4,
              name: 'banana',
              children: []
            }
          ]
        },
        {
          id: 6,
          name: 'orange',
          children: []
        }
      ]
    }
  ];
  console.time('flatTree');
  const res = flatTree(tree, { keyField: 'id', childField: 'children', pidField: 'pid' });
  console.timeEnd('flatTree');

  expect(res).toEqual([
    { id: 1, name: 'root' },
    { id: 10, name: 'ap-2p', pid: 1 },
    { id: 2, name: 'apple', pid: 1 },
    { id: 20, name: 'ab2p', pid: 2 },
    {
      id: 3,
      name: 'apricot',
      pid: 2
    },
    { id: 5, name: 'butterfly', pid: 3 },
    {
      id: 4,
      name: 'banana',
      pid: 2
    },
    {
      id: 6,
      name: 'orange',
      pid: 1
    }
  ]);
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

test('mapDeep', () => {
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
  const tree2 = [
    { id: 1, name: 'row1', age: 1 },
    {
      id: 2,
      name: 'row2',
      age: 2,
      childNodes: [{ id: 21, name: 'row2-1', age: 21 }]
    },
    { id: 3, name: 'row3' }
  ];

  let res0: any[] = [];
  let res1: any[] = [];
  let res2: any[] = [];
  let res3: any[] = [];
  let res4: any[] = [];
  let res5: any[] = [];
  let res6: any[] = [];

  // specified alias name of children
  res0 = mapDeep(
    tree2,
    ({ id, name, childNodes }) => {
      return { key: id, label: name, childNodes };
    },
    'childNodes'
  ) as any[];
  expect(res0).toEqual([
    { key: 1, label: 'row1' },
    {
      key: 2,
      label: 'row2',
      childNodes: [{ key: 21, label: 'row2-1' }]
    },
    { key: 3, label: 'row3' }
  ]);

  // customize item of element
  res1 = mapDeep(tree, ({ id, name, children }) => {
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
  res2 = mapDeep(
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
  res3 = mapDeep(tree, ({ id, name, children }) => {
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
  res4 = mapDeep(tree, ({ id, name, children }) => {
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
  res5 = mapDeep(cloneDeep(tree), ({ id, name, children }, i, currentArr: any) => {
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
  // test return item self of element
  res6 = mapDeep(tree, (item, i, currentArr: any) => {
    if (item.id === 21) {
      currentArr.push({ id: 22, name: 'row2-2' });
    }
    item.key = item.id;
    item.label = item.name;
    return item;
  });
  expect(res6).toEqual([
    { key: 1, id: 1, label: 'row1', name: 'row1', age: 1 },
    {
      id: 2,
      key: 2,
      name: 'row2',
      label: 'row2',
      age: 2,
      children: [
        { key: 21, label: 'row2-1', id: 21, name: 'row2-1', age: 21 },
        { key: 22, label: 'row2-2', id: 22, name: 'row2-2' }
      ]
    },
    { key: 3, label: 'row3', id: 3, name: 'row3' }
  ]);
});

describe('fuzzySearchTree', () => {
  test('search by keyword', () => {
    // 定义树结构
    const tree = [
      {
        id: 1,
        name: 'root',
        children: [
          { id: 10, name: 'ap-2p', children: [] },
          {
            id: 2,
            name: 'apple',
            children: [
              { id: 20, name: 'ab2p' },
              {
                id: 3,
                name: 'apricot',
                children: [{ id: 5, name: 'butterfly' }]
              },
              {
                id: 4,
                name: 'banana',
                children: []
              }
            ]
          },
          {
            id: 5,
            name: 'orange',
            children: []
          }
        ]
      }
    ];

    // 测试keyword 1
    const query = 'apr';
    const result = fuzzySearchTree(tree, { keyword: query });

    expect(result).toEqual([
      {
        id: 1,
        name: 'root',
        children: [
          {
            id: 2,
            name: 'apple',
            children: [
              {
                id: 3,
                name: 'apricot',
                children: []
              }
            ]
          }
        ]
      }
    ]);

    // 测试keyword 2
    const query2 = 'ap';
    const result2 = fuzzySearchTree(tree, { keyword: query2 });

    expect(result2).toEqual([
      {
        id: 1,
        name: 'root',
        children: [
          {
            id: 10,
            name: 'ap-2p',
            children: []
          },
          {
            id: 2,
            name: 'apple',
            children: [
              {
                id: 3,
                name: 'apricot',
                children: []
              }
            ]
          }
        ]
      }
    ]);

    // 测试keyword 3
    const query3 = 'butter';
    const result3 = fuzzySearchTree(tree, { keyword: query3 });
    expect(result3).toEqual([
      {
        id: 1,
        name: 'root',
        children: [
          {
            id: 2,
            name: 'apple',
            children: [
              {
                id: 3,
                name: 'apricot',
                children: [
                  {
                    id: 5,
                    name: 'butterfly'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]);
    // 测试keyword 4, removeEmptyChild:true移除空children字段, ignoreCase:true忽略大小写
    const query4 = 'an';
    const result4 = fuzzySearchTree(
      tree,
      { keyword: query4 },
      { childField: 'children', nameField: 'name', removeEmptyChild: true, ignoreCase: true }
    );

    expect(result4).toEqual([
      {
        id: 1,
        name: 'root',
        children: [
          {
            id: 2,
            name: 'apple',
            children: [
              {
                id: 4,
                name: 'banana'
              }
            ]
          },
          {
            id: 5,
            name: 'orange'
          }
        ]
      }
    ]);
  });

  test('search by filter function, include not ignore case', () => {
    const res1 = [];
    const res2 = [];
    // 定义树结构
    const tree = [
      {
        id: 1,
        name: 'root',
        children: [
          { id: 10, name: 'ap-2p', children: [] },
          {
            id: 2,
            name: 'apple',
            children: [
              { id: 20, name: 'ab2p' },
              {
                id: 3,
                name: 'Anpricot',
                children: [{ id: 5, name: 'butterfly' }]
              },
              {
                id: 4,
                name: 'banana',
                children: []
              }
            ]
          },
          {
            id: 5,
            name: 'orAnge',
            children: []
          }
        ]
      },
      {
        id: 22,
        name: 'apple',
        children: [
          { id: 220, name: 'ab2p' },
          {
            id: 23,
            name: 'Anpricot',
            children: [{ id: 25, name: 'butterfly' }]
          },
          {
            id: 24,
            name: 'banana',
            children: []
          }
        ]
      }
    ];
    const query = 'An';
    // keyword模式匹配，不忽略大小写
    const result1 = fuzzySearchTree(
      tree,
      { keyword: query },
      { childField: 'children', nameField: 'name', removeEmptyChild: true, ignoreCase: false }
    );

    expect(result1).toEqual([
      {
        id: 1,
        name: 'root',
        children: [
          {
            id: 2,
            name: 'apple',
            children: [
              {
                id: 3,
                name: 'Anpricot'
              }
            ]
          },
          {
            id: 5,
            name: 'orAnge'
          }
        ]
      },
      {
        id: 22,
        name: 'apple',
        children: [
          {
            id: 23,
            name: 'Anpricot'
          }
        ]
      }
    ]);
    // 根据filter函数过滤
    const result2 = fuzzySearchTree(
      tree,
      {
        filter: item => {
          return [3, 5, 23].includes(item.id);
        }
      },
      { childField: 'children', nameField: 'name', removeEmptyChild: true, ignoreCase: false }
    );

    expect(result2).toEqual([
      {
        id: 1,
        name: 'root',
        children: [
          {
            id: 2,
            name: 'apple',
            children: [
              {
                id: 3,
                name: 'Anpricot'
              }
            ]
          },
          {
            id: 5,
            name: 'orAnge'
          }
        ]
      },
      {
        id: 22,
        name: 'apple',
        children: [
          {
            id: 23,
            name: 'Anpricot'
          }
        ]
      }
    ]);
    // 无过滤条件
    const result3 = fuzzySearchTree(tree, {});
    expect(result3).toBe(tree);

    // keyword匹配模式，且keyword为空串
    const result4 = fuzzySearchTree(tree, { keyword: '' });
    expect(result4).toBe(tree);
  });
});
