import { objectOmit } from './object';
import { AnyObject, isNodeList, isObject, objectHas } from './type';

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
 * Tree traversal function (default DFS, supports continue and break operations).
 * Can be used to traverse Array and NodeList type data.
 * @param {V[]} tree - Tree data
 * @param {Function} iterator - Iterator function. Returns true to continue, false to break.
 * @param {object} options - Options to customize child element name, reverse traversal, breadth-first traversal. Default: {
    childField: 'children',
    reverse: false,
    breadthFirst: false,
    isDomNode: false,
  }
 * @returns {*}
 */
export function forEachDeep<V>(
  tree: V[],
  iterator: (val: V, index: number, currentArr: V[], tree: V[], parent: V | null, level: number) => boolean | void,
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
    array: V[];
    tree: V[];
    parent: V | null;
    level: number;
  }> = [];

  const processNode = (item: V, index: number, arr: V[], parent: V | null, level: number): void => {
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

  const walk = (arr: V[], parent: V | null, level: number) => {
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
 * Tree search function, can be used to search Array and NodeList type data.
 * @param {V[]} tree - Tree data
 * @param {Function} predicate - Predicate function
 * @param {object} options - Options to customize child element name, reverse traversal, breadth-first traversal. Default: {
    childField: 'children',
    reverse: false,
    breadthFirst: false,
    isDomNode: false,
  }
 * @returns {V|null}
 */
export function findDeep<V>(
  tree: V[],
  predicate: (val: V, index: number, currentArr: V[], tree: V[], parent: V | null, level: number) => boolean | void,
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
 * Tree filter function, can be used to filter Array and NodeList type data.
 * @param {V[]} tree - Tree data
 * @param {Function} predicate - Predicate function
 * @param {object} options - Options to customize child element name, reverse traversal, breadth-first traversal. Default: {
    childField: 'children',
    reverse: false,
    breadthFirst: false,
    isDomNode: false,
  }
 * @returns {V[]}
 */
export function filterDeep<V>(
  tree: V[],
  predicate: (val: V, index: number, currentArr: V[], tree: V[], parent: V | null, level: number) => boolean | void,
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
 * Creates a new array using a depth-first traversal Map function (supports continue and break operations).
 * Can be used for inserting or removing tree items.
 *
 * Can traverse any array-like object with a length property and numeric keys.
 * @param {V[]} tree - Tree data
 * @param {Function} iterator - Iterator function. Returns true to continue, false to break.
 * @param {object} options - Options to customize child element name, reverse traversal. Default: {
    childField: 'children',
    reverse: false,
  }
 * @returns {any[]} A new tree structure
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
 * Retrieves the path (ancestors + self) for a given node ID.
 *
 * @param {ArrayLike<T>} tree - Tree data
 * @param {number | string} nodeId - Target node ID
 * @param {ITreeConf} options - Configuration. Default: { childField = 'children', keyField = 'id' }
 * @returns {[(number | string)[], V[]]} - Array of IDs and Array of Nodes from root to target
 */
export function getPathById<V>(
  tree: V[],
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

export { getPathById as searchTreeById };

/**
 * Converts a flat array into a tree structure.
 * @param {any[]} list - Flat list of items
 * @param {IFieldOptions} options - Customizes id field name, child element field name, parent element field name. Default:
 *        { keyField: 'key', childField: 'children', pidField: 'pid' }
 * @returns {any[]} Tree structure array
 */
export function formatTree(list: any[], options: IFieldOptions = defaultFieldOptions): any[] {
  const { keyField = 'key', childField = 'children', pidField = 'pid' } = isObject(options) ? options : {};
  const treeArr: any[] = [];
  const sourceMap: Record<string, any> = {};

  const len = list.length;
  // 先克隆所有对象，避免修改源数据
  for (let i = 0; i < len; i++) {
    const item = list[i];
    sourceMap[item[keyField]] = item;
  }

  for (let i = 0; i < len; i++) {
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
 * Converts a tree structure into a flat array.
 * @param {any[]} treeList - Tree structure array
 * @param {IFieldOptions} options - Customizes id field name, child element field name, parent element field name. Default:
 *        { keyField: 'key', childField: 'children', pidField: 'pid' }
 * @returns {any[]} Flat array
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
 * Fuzzy search function that returns nodes containing the search character and their ancestor nodes.
 * Suitable for character filtering in tree components.
 *
 * Two search conditions are available, processed in priority order:
 * 1. Filter function `filter`, returning true/false.
 * 2. Keyword matching, supporting case-insensitive check.
 *
 * Features:
 * 1. Configurable `removeEmptyChild` field to decide whether to remove empty children fields in search results.
 * 2. If no filter condition is provided, or keyword mode is used with an empty keyword, the original object is returned; otherwise, a new array is returned.
 *
 * @param {V[]} nodes - Tree nodes
 * @param {IFilterCondition} filterCondition - Filter conditions
 * @param {ISearchTreeOpts} options - Default configuration: {
      childField: 'children',
      nameField: 'name',
      removeEmptyChild: false,
      ignoreCase: true
    }
 * @returns {V[]} Filtered tree nodes
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
  getPathById,
  searchTreeById: getPathById,
  formatTree,
  flatTree,
  fuzzySearchTree
};
