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
  nameField: string;
  removeEmptyChild: boolean;
  ignoreCase: boolean;
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

function getChildNodes<V>(item: V, childField: string, isDomNode: boolean): any[] | null {
  const child = (item as any)[childField];
  if (!child) return null;
  return isDomNode && isNodeList(child) ? Array.from(child) : Array.isArray(child) ? child : null;
}

/**
 * 深度遍历函数 (支持 continue 和 break 操作), 可用于遍历 Array 和 NodeList 类型的数据
 * @param {ArrayLike<V>} tree  树形数据
 * @param {Function} iterator  迭代函数，返回值为 true 时 continue, 返回值为 false 时 break
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
  const queue: Array<{
    item: V;
    index: number;
    array: ArrayLike<V>;
    tree: ArrayLike<V>;
    parent: V | null;
    level: number;
  }> = [];

  const processNode = (item: V, index: number, arr: ArrayLike<V>, parent: V | null, level: number): void => {
    const re = iterator(item, index, arr, tree, parent, level);
    if (re === false) {
      isBreak = true;
      return;
    }
    if (re === true) return;

    const childNodes = getChildNodes(item, childField, isDomNode);
    if (childNodes) {
      if (breadthFirst) {
        // BFS: 将子节点加入队列
        const childLen = childNodes.length;
        for (let i = 0; i < childLen; i++) {
          queue.push({ item: childNodes[i], index: i, array: childNodes, tree, parent: item, level: level + 1 });
        }
      } else {
        // DFS: 立即递归处理子节点
        walk(childNodes, item, level + 1);
      }
    }
  };

  const walk = (arr: ArrayLike<V>, parent: V | null, level: number) => {
    const len = arr.length;

    if (reverse) {
      for (let i = len - 1; i >= 0; i--) {
        if (isBreak) break;
        processNode(arr[i], i, arr, parent, level);
      }
    } else {
      for (let i = 0; i < len; i++) {
        if (isBreak) break;
        processNode(arr[i], i, arr, parent, level);
      }
    }
  };

  // 先处理根节点
  walk(tree, null, 0);

  // BFS: 处理队列中的节点
  if (breadthFirst) {
    let queueIndex = 0;
    while (queueIndex < queue.length && !isBreak) {
      const { item, index, array, parent, level } = queue[queueIndex++];
      processNode(item, index, array, parent, level);
    }
  }

  // @ts-ignore
  tree = null;
}

/**
 * 树查找函数，可用于查找 Array 和 NodeList 类型的数据
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
  let result: V | null = null;
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
 * 树过滤函数，可用于过滤 Array 和 NodeList 类型的数据
 * @param {ArrayLike<V>} tree  树形数据
 * @param {Function} predicate  断言函数
 * @param {options} options 支持定制子元素名称、反向遍历、广度优先遍历，默认{
    childField: 'children',
    reverse: false,
    breadthFirst: false,
    isDomNode: false,
  }
 * @returns {V[]}
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
 * 创建一个新数组，深度优先遍历的 Map 函数 (支持 continue 和 break 操作), 可用于 insert tree item 和 remove tree item
 *
 * 可遍历任何带有 length 属性和数字键的类数组对象
 * @param {ArrayLike<V>} tree  树形数据
 * @param {Function} iterator  迭代函数，返回值为 true 时 continue, 返回值为 false 时 break
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
  const newTree: any[] = [];

  const walk = (arr: T[], parent: T | null, output: any[], level: number) => {
    if (reverse) {
      for (let i = arr.length - 1; i >= 0; i--) {
        if (isBreak) break;
        const item = arr[i];
        const re = iterator(item, i, arr, tree, parent, level);

        if (re === false) {
          isBreak = true;
          break;
        }
        if (re === true) continue;

        const newItem = objectOmit(re, [childField]);
        output.push(newItem);

        const children = (item as any)[childField];
        if (Array.isArray(children)) {
          (newItem as any)[childField] = [];
          walk(children, item, (newItem as any)[childField], level + 1);
        }
      }
    } else {
      for (let i = 0; i < arr.length; i++) {
        if (isBreak) break;
        const item = arr[i];
        const re = iterator(item, i, arr, tree, parent, level);

        if (re === false) {
          isBreak = true;
          break;
        }
        if (re === true) continue;

        const newItem = objectOmit(re, [childField]);
        output.push(newItem);

        const children = (item as any)[childField];
        if (Array.isArray(children)) {
          (newItem as any)[childField] = [];
          walk(children, item, (newItem as any)[childField], level + 1);
        }
      }
    }
  };

  walk(tree, null, newTree, 0);
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
 * @param {number | string} nodeId - 目标元素 ID
 * @param {ITreeConf} options - 迭代配置项，默认：{ children = 'children', id = 'id' }
 * @returns {[(number | string)[], V[]]} - 由 parentId...childId, parentObject-childObject 组成的二维数组
 */
export function searchTreeById<V>(
  tree: ArrayLike<V>,
  nodeId: IdLike,
  options: ITreeConf = { childField: 'children', keyField: 'id' }
): [(number | string)[], any[]] {
  const { childField = 'children', keyField = 'id' } = isObject(options) ? options : {};

  const flatMap: Record<string, { node: any; parentId?: IdLike; parent?: any }> = {};

  // 扁平化 - 使用迭代而非递归，避免栈溢出
  const stack: Array<{ node: any; parentId?: IdLike; parent?: any }> = [];
  const len = tree.length;
  for (let i = 0; i < len; i++) {
    stack.push({ node: tree[i] });
  }

  while (stack.length > 0) {
    const { node, parentId, parent } = stack.pop()!;
    const id = (node as any)[keyField];
    flatMap[id] = { node, parentId, parent };

    const children = (node as any)[childField];
    if (Array.isArray(children)) {
      const childLen = children.length;
      for (let i = 0; i < childLen; i++) {
        stack.push({ node: children[i], parentId: id, parent: node });
      }
    }
  }

  // 回溯路径
  const ids: IdLike[] = [];
  const nodes: any[] = [];
  let current = flatMap[nodeId];

  if (!current) return [[], []];

  ids.push(nodeId);
  nodes.push(current.node);

  while (current && current.parentId !== undefined) {
    ids.unshift(current.parentId);
    const parent = flatMap[current.parentId];
    if (!parent) break;
    nodes.unshift(parent.node);
    current = parent;
  }

  return [ids, nodes];
}

/**
 * 扁平化数组转换成树
 * @param {any[]} list
 * @param {IFieldOptions} options 定制 id 字段名，子元素字段名，父元素字段名，默认
 *        { keyField: 'key', childField: 'children', pidField: 'pid' }
 * @returns {any[]}
 */
export function formatTree(list: any[], options: IFieldOptions = defaultFieldOptions): any[] {
  const { keyField = 'key', childField = 'children', pidField = 'pid' } = isObject(options) ? options : {};
  const treeArr: any[] = [];
  const sourceMap: Record<string, any> = {};

  const len = list.length;
  // 先克隆所有对象，避免修改源数据
  for (let i = 0; i < len; i++) {
    const item = { ...list[i] };
    sourceMap[item[keyField]] = item;
  }

  for (let i = 0; i < len; i++) {
    const item = sourceMap[list[i][keyField]];
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
 * @param {IFieldOptions} options 定制 id 字段名，子元素字段名，父元素字段名，默认
 *        { keyField: 'key', childField: 'children', pidField: 'pid' }
 * @returns {any[]}
 */
export function flatTree(treeList: any[], options: IFieldOptions = defaultFieldOptions): any[] {
  const { keyField = 'key', childField = 'children', pidField = 'pid' } = isObject(options) ? options : {};
  const res: any[] = [];

  const walk = (nodes: any[]) => {
    const len = nodes.length;
    for (let i = 0; i < len; i++) {
      const node = nodes[i];
      const item = { ...node };
      delete item[childField];
      res.push(item);

      const children = node[childField];
      if (Array.isArray(children)) {
        // 创建新的子节点数组，不修改原数据
        const newChildren = children.map((child: any) => ({
          ...child,
          [pidField]: node[keyField] !== undefined ? node[keyField] : child.pid
        }));
        walk(newChildren);
      }
    }
  };

  walk(treeList);
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
  const { childField, nameField, removeEmptyChild, ignoreCase } = options;
  const hasFilter = objectHas(filterCondition as AnyObject, 'filter');
  const filterFn = filterCondition.filter;
  const keyword = filterCondition.keyword;

  for (let i = 0, len = nodes.length; i < len; i++) {
    const node: any = nodes[i];
    const children = node[childField];

    // 递归处理子节点
    const matchedChildren = children && children.length > 0 ? fuzzySearchTree(children, filterCondition, options) : [];

    // 判断当前节点是否匹配
    let isMatch = false;
    if (hasFilter && filterFn) {
      isMatch = filterFn(node);
    } else if (keyword !== undefined && keyword !== null) {
      const nodeValue = String(node[nameField] || '');
      const searchValue = String(keyword);
      isMatch = ignoreCase
        ? nodeValue.toLowerCase().includes(searchValue.toLowerCase())
        : nodeValue.includes(searchValue);
    }

    // 如果当前节点匹配或有匹配的子节点，则加入结果
    if (isMatch || matchedChildren.length > 0) {
      if (childField in node) {
        // 节点有 children 字段
        if (matchedChildren.length > 0) {
          // 有匹配的子节点
          result.push({ ...node, [childField]: matchedChildren });
        } else if (removeEmptyChild) {
          // 无匹配子节点且需要移除空 children
          const { [childField]: _, ...rest } = node;
          result.push(rest);
        } else {
          // 无匹配子节点但保留 children 字段（设为空数组）
          result.push({ ...node, [childField]: [] });
        }
      } else {
        // 节点没有 children 字段，直接返回
        result.push(node);
      }
    }
  }

  return result;
}

export default {
  forEachDeep,
  findDeep,
  filterDeep,
  mapDeep,
  searchTreeById,
  formatTree,
  flatTree,
  fuzzySearchTree
};
