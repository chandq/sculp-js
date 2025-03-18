export interface IFieldOptions {
  keyField: string;
  childField: string;
  pidField: string;
}
const defaultFieldOptions: IFieldOptions = { keyField: 'key', childField: 'children', pidField: 'pid' };

export interface ISearchTreeOpts {
  childField: string;
  nameField: string; // 匹配字段
  ignoreEmptyChild: boolean; // 查询结果不包含空的children
}
const defaultSearchTreeOptions: ISearchTreeOpts = {
  childField: 'children',
  nameField: 'name',
  ignoreEmptyChild: false
};

/**
 * 深度优先遍历函数(支持continue和break操作), 可用于insert tree item 和 remove tree item
 * @param {ArrayLike<V>} tree  树形数据
 * @param {Function} iterator  迭代函数, 返回值为true时continue, 返回值为false时break
 * @param {string} children 定制子元素的key
 * @param {boolean} isReverse  是否反向遍历
 * @returns {*}
 */
export function forEachDeep<V>(
  tree: ArrayLike<V>,
  iterator: (
    val: V,
    i: number,
    currentArr: ArrayLike<V>,
    tree: ArrayLike<V>,
    parent: V | null,
    level: number
  ) => boolean | void,
  children: string = 'children',
  isReverse = false
): void {
  let isBreak = false;
  const walk = (arr: ArrayLike<V>, parent: V | null, level = 0) => {
    if (isReverse) {
      for (let i = arr.length - 1; i >= 0; i--) {
        if (isBreak) {
          break;
        }
        const re = iterator(arr[i], i, arr, tree, parent, level);
        if (re === false) {
          isBreak = true;
          break;
        } else if (re === true) {
          continue;
        }
        // @ts-ignore
        if (arr[i] && Array.isArray(arr[i][children])) {
          // @ts-ignore
          walk(arr[i][children], arr[i], level + 1);
        }
      }
    } else {
      for (let i = 0; i < arr.length; i++) {
        if (isBreak) {
          break;
        }
        const re = iterator(arr[i], i, arr, tree, parent, level);
        if (re === false) {
          isBreak = true;
          break;
        } else if (re === true) {
          continue;
        }
        // @ts-ignore
        if (arr[i] && Array.isArray(arr[i][children])) {
          // @ts-ignore
          walk(arr[i][children], arr[i], level + 1);
        }
      }
    }
  };
  walk(tree, null);
}

/**
 * 深度优先遍历的Map函数(支持continue和break操作), 可用于insert tree item 和 remove tree item
 * @param {ArrayLike<V>} tree  树形数据
 * @param {Function} iterator  迭代函数, 返回值为true时continue, 返回值为false时break
 * @param {string} children 定制子元素的key
 * @param {boolean} isReverse  是否反向遍历
 * @returns {any[]} 新的一棵树
 */
export function forEachMap<V>(
  tree: ArrayLike<V>,
  iterator: (
    val: V,
    i: number,
    currentArr: ArrayLike<V>,
    tree: ArrayLike<V>,
    parent: V | null,
    level: number
  ) => boolean | any,
  children: string = 'children',
  isReverse = false
): any[] {
  let isBreak = false;
  const newTree = [];
  const walk = (arr: ArrayLike<V>, parent: V | null, newTree: any[], level = 0) => {
    if (isReverse) {
      for (let i = arr.length - 1; i >= 0; i--) {
        if (isBreak) {
          break;
        }
        const re = iterator(arr[i], i, arr, tree, parent, level);
        if (re === false) {
          isBreak = true;
          break;
        } else if (re === true) {
          continue;
        }
        newTree.push(re);
        // @ts-ignore
        if (arr[i] && Array.isArray(arr[i][children])) {
          newTree[newTree.length - 1][children] = [];
          // @ts-ignore
          walk(arr[i][children], arr[i], newTree[newTree.length - 1][children], level + 1);
        } else {
          // children非有效数组时，移除该属性字段
          delete re[children];
        }
      }
    } else {
      for (let i = 0; i < arr.length; i++) {
        if (isBreak) {
          break;
        }
        const re = iterator(arr[i], i, arr, tree, parent, level);
        if (re === false) {
          isBreak = true;
          break;
        } else if (re === true) {
          continue;
        }
        newTree.push(re);
        // @ts-ignore
        if (arr[i] && Array.isArray(arr[i][children])) {
          newTree[newTree.length - 1][children] = [];
          // @ts-ignore
          walk(arr[i][children], arr[i], newTree[newTree.length - 1][children], level + 1);
        } else {
          // children非有效数组时，移除该属性字段
          delete re[children];
        }
      }
    }
  };
  walk(tree, null, newTree);
  return newTree;
}
export type IdLike = number | string;
export interface ITreeConf {
  id: string | number;
  children: string;
}
/**
 * 在树中找到 id 为某个值的节点，并返回上游的所有父级节点
 *
 * @param {ArrayLike<T>} tree - 树形数据
 * @param {IdLike} nodeId - 元素ID
 * @param {ITreeConf} config - 迭代配置项
 * @returns {[IdLike[], ITreeItem<V>[]]} - 由parentId...childId, parentObject-childObject组成的二维数组
 */
export function searchTreeById<V>(tree: ArrayLike<V>, nodeId: IdLike, config?: ITreeConf): [IdLike[], ArrayLike<V>[]] {
  const { children = 'children', id = 'id' } = config || {};
  const toFlatArray = (tree, parentId?: IdLike, parent?: any) => {
    return tree.reduce((t, _) => {
      const child = _[children];
      return [
        ...t,
        parentId ? { ..._, parentId, parent } : _,
        ...(child && child.length ? toFlatArray(child, _[id], _) : [])
      ];
    }, []);
  };
  const getIds = (flatArray): [IdLike[], ArrayLike<V>[]] => {
    let child = flatArray.find(_ => _[id] === nodeId);
    const { parent, parentId, ...other } = child;
    let ids = [nodeId],
      nodes = [other];
    while (child && child.parentId) {
      ids = [child.parentId, ...ids];
      nodes = [child.parent, ...nodes];
      child = flatArray.find(_ => _[id] === child.parentId); // eslint-disable-line
    }
    return [ids, nodes];
  };
  return getIds(toFlatArray(tree));
}

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

export type WithChildren<T> = T & { children?: WithChildren<T>[] };

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

/**
 * 扁平化数组转换成树(效率高于buildTree)
 * @param {any[]} list
 * @param {IFieldOptions} options
 * @returns {any[]}
 */
export function formatTree(list: any[], options: IFieldOptions = defaultFieldOptions): any[] {
  const { keyField, childField, pidField } = options;
  const treeArr: any[] = [];
  const sourceMap = {};
  list.forEach(item => {
    sourceMap[item[keyField]] = item;
  });

  list.forEach(item => {
    const parent = sourceMap[item[pidField]];
    if (parent) {
      (parent[childField] || (parent[childField] = [])).push(item);
    } else {
      treeArr.push(item);
    }
  });
  return treeArr;
}

/**
 * 树形结构转扁平化
 * @param {any} treeList
 * @param {IFieldOptions} options
 * @returns {*}
 */
export function flatTree(treeList: any[], options: IFieldOptions = defaultFieldOptions): any[] {
  const { childField, keyField, pidField } = options;
  return treeList.reduce((res, node) => {
    const item = {
      ...node,
      [childField]: [] // 清空子级
    };
    item.hasOwnProperty([childField]) && delete item[childField];
    res.push(item);
    if (node[childField]) {
      const children = node[childField].map(item => ({
        ...item,
        [pidField]: node[keyField] || item.pid // 给子级设置pid
      }));
      res = res.concat(flatTree(children, options));
    }
    return res;
  }, []);
}

/**
 * 模糊搜索函数，返回包含搜索字符的节点及其祖先节点, 适用于树型组件的字符过滤功能
 * @param {any[]} nodes
 * @param {string} query
 * @param {ISearchTreeOpts} options
 * @returns {any[]}
 */
export function fuzzySearchTree(
  nodes: any[],
  query: string,
  options: ISearchTreeOpts = defaultSearchTreeOptions
): any[] {
  const result: any[] = [];

  for (const node of nodes) {
    // 递归检查子节点是否匹配
    const matchedChildren =
      node[options.childField] && node[options.childField].length > 0
        ? fuzzySearchTree(node[options.childField] || [], query, options)
        : [];

    // 检查当前节点是否匹配或者有匹配的子节点
    if (node[options.nameField].toLowerCase().includes(query.toLowerCase()) || matchedChildren.length > 0) {
      // 将当前节点加入结果中
      if (node[options.childField]) {
        if (matchedChildren.length > 0) {
          result.push({
            ...node,
            [options.childField]: matchedChildren // 包含匹配的子节点
          });
        } else if (options.ignoreEmptyChild) {
          node[options.childField] && delete node[options.childField];
          result.push({
            ...node
          });
        } else {
          result.push({
            ...node,
            ...{ [options.childField]: [] }
          });
        }
      } else {
        node[options.childField] && delete node[options.childField];

        result.push({
          ...node
        });
      }
    }
  }
  return result;
}
