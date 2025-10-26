import { objectOmit } from './object';
import { AnyObject, isEmpty, isNodeList, isObject, objectHas } from './type';

export interface IFieldOptions {
  keyField: string;
  childField: string;
  pidField: string;
}
const defaultFieldOptions: IFieldOptions = { keyField: 'key', childField: 'children', pidField: 'pid' };

export interface ISearchTreeOpts {
  childField: string;
  nameField: string; // 匹配字段
  removeEmptyChild: boolean; // 搜索结果中不包含空的children
  ignoreCase: boolean; // 忽略大小写
}
const defaultSearchTreeOptions: ISearchTreeOpts = {
  childField: 'children',
  nameField: 'name',
  removeEmptyChild: false,
  ignoreCase: true
};
export interface IFilterCondition<V> {
  keyword?: string;
  filter?: (args: V) => boolean;
}

/**
 * 树遍历函数(支持continue和break操作), 可用于遍历Array和NodeList类型的数据
 * @param {ArrayLike<V>} tree  树形数据
 * @param {Function} iterator  迭代函数, 返回值为true时continue, 返回值为false时break
 * @param {options} options 支持定制子元素名称、反向遍历、广度优先遍历，默认{
    childField: 'children',
    reverse: false,
    breadthFirst: false,
    isDomNode: false,
  }
 * @returns {*}
 */
export function forEachDeep<V>(
  tree: ArrayLike<V>,
  iterator: (
    val: V,
    index: number,
    currentArr: ArrayLike<V>,
    tree: ArrayLike<V>,
    parent: V | null,
    level: number
  ) => boolean | void,
  options: { childField?: string; reverse?: boolean; breadthFirst?: boolean; isDomNode?: boolean } = {
    childField: 'children',
    reverse: false,
    breadthFirst: false,
    isDomNode: false
  }
): void {
  const {
    childField = 'children',
    reverse = false,
    breadthFirst = false,
    isDomNode = false
  } = isObject(options) ? options : {};
  let isBreak = false;
  const queue: {
    item: V;
    index: number;
    array: ArrayLike<V>;
    tree: ArrayLike<V>;
    parent: V | null;
    level: number;
  }[] = [];
  const reverseWalk = (arr: ArrayLike<V>, parent: V | null, level = 0) => {
    for (let index = arr.length - 1; index >= 0; index--) {
      if (isBreak) {
        break;
      }
      const item = arr[index];
      // 广度优先
      if (breadthFirst) {
        queue.push({ item, index, array: arr, tree, parent, level });
      } else {
        const re = iterator(item, index, arr, tree, parent, level);
        if (re === false) {
          isBreak = true;
          break;
        } else if (re === true) {
          continue;
        }
        if (item && (isDomNode ? isNodeList(item[childField]) : Array.isArray(item[childField]))) {
          reverseWalk(item[childField], item, level + 1);
        }
      }
    }
    if (breadthFirst) {
      // Process queue
      while (queue.length > 0 && !isBreak) {
        const current = queue.shift();
        const { item, index, array, tree, parent, level } = current!;
        const re = iterator(item, index, array, tree, parent, level);
        if (re === false) {
          isBreak = true;
          break;
        } else if (re === true) {
          continue;
        }
        if (item && (isDomNode ? isNodeList(item[childField]) : Array.isArray(item[childField]))) {
          reverseWalk(item[childField], item, level + 1);
        }
      }
    }
  };
  const walk = (arr: ArrayLike<V>, parent: V | null, level = 0) => {
    for (let index = 0, len = arr.length; index < len; index++) {
      if (isBreak) {
        break;
      }
      const item = arr[index];
      if (breadthFirst) {
        // 广度优先
        queue.push({ item, index: index, array: arr, tree, parent, level });
      } else {
        // 深度优先
        const re = iterator(item, index, arr, tree, parent, level);
        if (re === false) {
          isBreak = true;
          break;
        } else if (re === true) {
          continue;
        }
        if (item && (isDomNode ? isNodeList(item[childField]) : Array.isArray(item[childField]))) {
          walk(item[childField], item, level + 1);
        }
      }
    }
    if (breadthFirst) {
      while (queue.length > 0 && !isBreak) {
        const current = queue.shift();
        if (!current) break;
        const { item, index, array, tree, parent, level } = current;
        const re = iterator(item, index, array, tree, parent, level);
        if (re === false) {
          isBreak = true;
          break;
        } else if (re === true) {
          continue;
        }
        if (item && (isDomNode ? isNodeList(item[childField]) : Array.isArray(item[childField]))) {
          walk(item[childField], item, level + 1);
        }
      }
    }
  };
  reverse ? reverseWalk(tree, null, 0) : walk(tree, null, 0);
  // @ts-ignore
  tree = null;
}

/**
 * 树查找函数, 可用于查找Array和NodeList类型的数据
 * @param {ArrayLike<V>} tree  树形数据
 * @param {Function} predicate  断言函数
 * @param {options} options 支持定制子元素名称、反向遍历、广度优先遍历，默认{
    childField: 'children',
    reverse: false,
    breadthFirst: false,
    isDomNode: false,
  }
 * @returns {V|null}
 */
export function findDeep<V>(
  tree: ArrayLike<V>,
  predicate: (
    val: V,
    index: number,
    currentArr: ArrayLike<V>,
    tree: ArrayLike<V>,
    parent: V | null,
    level: number
  ) => boolean | void,
  options: { childField?: string; reverse?: boolean; breadthFirst?: boolean; isDomNode?: boolean } = {
    childField: 'children',
    reverse: false,
    breadthFirst: false,
    isDomNode: false
  }
): V | null {
  let result: null | V = null;
  forEachDeep(
    tree,
    (...args) => {
      if (predicate(...args)) {
        result = args[0];
        return false;
      }
    },
    options
  );
  return result;
}

/**
 * 树过滤函数, 可用于过滤Array和NodeList类型的数据
 * @param {ArrayLike<V>} tree  树形数据
 * @param {Function} predicate  断言函数
 * @param {options} options 支持定制子元素名称、反向遍历、广度优先遍历，默认{
    childField: 'children',
    reverse: false,
    breadthFirst: false,
    isDomNode: false,
  }
 * @returns {V|null}
 */
export function filterDeep<V>(
  tree: ArrayLike<V>,
  predicate: (
    val: V,
    index: number,
    currentArr: ArrayLike<V>,
    tree: ArrayLike<V>,
    parent: V | null,
    level: number
  ) => boolean | void,
  options: { childField?: string; reverse?: boolean; breadthFirst?: boolean; isDomNode?: boolean } = {
    childField: 'children',
    reverse: false,
    breadthFirst: false,
    isDomNode: false
  }
): V[] {
  const result: V[] = [];
  forEachDeep(
    tree,
    (...args) => {
      if (predicate(...args)) {
        result.push(args[0]);
      }
    },
    options
  );
  return result;
}

/**
 * 创建一个新数组, 深度优先遍历的Map函数(支持continue和break操作), 可用于insert tree item 和 remove tree item
 *
 * 可遍历任何带有 length 属性和数字键的类数组对象
 * @param {ArrayLike<V>} tree  树形数据
 * @param {Function} iterator  迭代函数, 返回值为true时continue, 返回值为false时break
 * @param {options} options 支持定制子元素名称、反向遍历，默认{
    childField: 'children',
    reverse: false,
  }
 * @returns {any[]} 新的一棵树
 */
export function mapDeep<T>(
  tree: T[],
  iterator: (
    val: T,
    index: number,
    currentArr: T[],
    tree: T[],
    parent: T | null,
    level: number
  ) => { [k: string | number]: any } | boolean,
  options: { childField?: string; reverse?: boolean; breadthFirst?: boolean } = {
    childField: 'children',
    reverse: false
  }
): any[] {
  const { childField = 'children', reverse = false } = isObject(options) ? options : {};
  let isBreak = false;
  const newTree = [];
  const walk = (arr: T[], parent: T | null, newTree: any[], level = 0) => {
    if (reverse) {
      for (let i = arr.length - 1; i >= 0; i--) {
        if (isBreak) {
          break;
        }

        const item = arr[i];
        const re = iterator(item, i, arr, tree, parent, level);
        if (re === false) {
          isBreak = true;
          break;
        } else if (re === true) {
          continue;
        }
        newTree.push(objectOmit(re, [childField as any]));
        if (item && Array.isArray(item[childField])) {
          newTree[newTree.length - 1][childField] = [];
          walk(item[childField], item, newTree[newTree.length - 1][childField], level + 1);
        } else {
          // children非有效数组时，移除该属性字段
          delete re[childField];
        }
      }
    } else {
      for (let i = 0; i < arr.length; i++) {
        if (isBreak) {
          break;
        }
        const item = arr[i];
        const re = iterator(item, i, arr, tree, parent, level);
        if (re === false) {
          isBreak = true;
          break;
        } else if (re === true) {
          continue;
        }
        newTree.push(objectOmit(re, [childField as any]));
        if (item && Array.isArray(item[childField])) {
          newTree[newTree.length - 1][childField] = [];
          walk(item[childField], item, newTree[newTree.length - 1][childField], level + 1);
        } else {
          // children非有效数组时，移除该属性字段
          delete re[childField];
        }
      }
    }
  };
  walk(tree, null, newTree);

  // @ts-ignore
  tree = null;
  return newTree;
}
export type IdLike = number | string;
export type ITreeConf = Omit<IFieldOptions, 'pidField'>;
/**
 * 在树中找到 id 为某个值的节点，并返回上游的所有父级节点
 *
 * @param {ArrayLike<T>} tree - 树形数据
 * @param {number | string} nodeId - 目标元素ID
 * @param {ITreeConf} options - 迭代配置项, 默认：{ children = 'children', id = 'id' }
 * @returns {[(number | string)[], V[]]} - 由parentId...childId, parentObject-childObject组成的二维数组
 */
export function searchTreeById<V>(
  tree: ArrayLike<V>,
  nodeId: IdLike,
  options: ITreeConf = { childField: 'children', keyField: 'id' }
): [(number | string)[], ArrayLike<V>[]] {
  const { childField = 'children', keyField = 'id' } = isObject(options) ? options : {};

  const toFlatArray = (tree, parentId?: IdLike, parent?: any) => {
    return tree.reduce((t, _) => {
      const child = _[childField];
      return [
        ...t,
        parentId ? { ..._, parentId, parent } : _,
        ...(child && child.length ? toFlatArray(child, _[keyField], _) : [])
      ];
    }, []);
  };
  const getIds = (flatArray): [IdLike[], ArrayLike<V>[]] => {
    let child = flatArray.find(_ => _[keyField] === nodeId);
    const { parent, parentId, ...other } = child;
    let ids = [nodeId],
      nodes = [other];
    while (child && child.parentId) {
      ids = [child.parentId, ...ids];
      nodes = [child.parent, ...nodes];
      child = flatArray.find(_ => _[keyField] === child.parentId); // eslint-disable-line
    }
    return [ids, nodes];
  };
  return getIds(toFlatArray(tree));
}

/**
 * 扁平化数组转换成树
 * @param {any[]} list
 * @param {IFieldOptions} options 定制id字段名，子元素字段名，父元素字段名，默认
 *        { keyField: 'key', childField: 'children', pidField: 'pid' }
 * @returns {any[]}
 */
export function formatTree(list: any[], options: IFieldOptions = defaultFieldOptions): any[] {
  const { keyField = 'key', childField = 'children', pidField = 'pid' } = isObject(options) ? options : {};
  const treeArr: any[] = [];
  const sourceMap = {};

  for (let i = 0, len = list.length; i < len; i++) {
    const item = list[i];
    sourceMap[item[keyField]] = item;
  }

  for (let i = 0, len = list.length; i < len; i++) {
    const item = list[i];
    const parent = sourceMap[item[pidField]];
    if (parent) {
      (parent[childField] || (parent[childField] = [])).push(item);
    } else {
      treeArr.push(item);
    }
  }

  // @ts-ignore
  list = null;
  return treeArr;
}

/**
 * 树形结构转扁平化
 * @param {any[]} treeList
 * @param {IFieldOptions} options 定制id字段名，子元素字段名，父元素字段名，默认
 *        { keyField: 'key', childField: 'children', pidField: 'pid' }
 * @returns {any[]}
 */
export function flatTree(treeList: any[], options: IFieldOptions = defaultFieldOptions): any[] {
  const { keyField = 'key', childField = 'children', pidField = 'pid' } = isObject(options) ? options : {};
  let res: any[] = [];
  for (let i = 0, len = treeList.length; i < len; i++) {
    const node = treeList[i];
    const item = {
      ...node,
      [childField]: [] // 清空子级
    };
    objectHas(item, childField) && delete item[childField];
    res.push(item);
    if (node[childField]) {
      const children = node[childField].map(item => ({
        ...item,
        [pidField]: node[keyField] || item.pid // 给子级设置pid
      }));
      res = res.concat(flatTree(children, options));
    }
  }

  return res;
}

/**
 * 模糊搜索函数，返回包含搜索字符的节点及其祖先节点, 适用于树型组件的字符过滤功能
 * 以下搜索条件二选一，按先后优先级处理：
 * 1. 过滤函数filter, 返回true/false
 * 2. 匹配关键词，支持是否启用忽略大小写来判断
 *
 * 有以下特性：
 * 1. 可配置removeEmptyChild字段，来决定是否移除搜索结果中的空children字段
 * 2. 若无任何过滤条件或keyword模式匹配且keyword为空串，返回原对象；其他情况返回新数组
 * @param {V[]} nodes
 * @param {IFilterCondition} filterCondition
 * @param {ISearchTreeOpts} options 默认配置项 {
      childField: 'children',
      nameField: 'name',
      removeEmptyChild: false,
      ignoreCase: true
    }
 * @returns {V[]}
 */
export function fuzzySearchTree<V>(
  nodes: V[],
  filterCondition: IFilterCondition<V>,
  options: ISearchTreeOpts = defaultSearchTreeOptions
): V[] {
  if (!objectHas(filterCondition, 'filter') && !filterCondition.keyword) {
    return nodes;
  }
  const result: V[] = [];

  for (let i = 0, len = nodes.length; i < len; i++) {
    const node = nodes[i];
    // 递归检查子节点是否匹配
    const matchedChildren =
      node[options.childField] && node[options.childField].length > 0
        ? fuzzySearchTree(node[options.childField] || [], filterCondition, options)
        : [];

    // 检查当前节点是否匹配或者有匹配的子节点
    if (
      (objectHas(filterCondition as AnyObject, 'filter')
        ? filterCondition.filter!(node)
        : !options.ignoreCase
        ? node[options.nameField].includes(filterCondition.keyword!)
        : node[options.nameField].toLowerCase().includes(filterCondition.keyword!.toLowerCase())) ||
      matchedChildren.length > 0
    ) {
      // 将当前节点加入结果中
      if (node[options.childField]) {
        if (matchedChildren.length > 0) {
          result.push({
            ...node,
            [options.childField]: matchedChildren // 包含匹配的子节点
          });
        } else if (options.removeEmptyChild) {
          const { [options.childField]: _, ...other } = node as any;
          result.push(other);
        } else {
          result.push({
            ...node,
            [options.childField]: []
          });
        }
      } else {
        const { [options.childField]: _, ...other } = node as any;
        result.push(other);
      }
    }
  }

  return result;
}
