import { arrayEach } from './array';
import { objectOmit } from './object';
import { AnyObject, isEmpty, objectHas } from './type';

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
      for (let i = 0, len = arr.length; i < len; i++) {
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
  // @ts-ignore
  tree = null;
}

/**
 * 创建一个新数组, 深度优先遍历的Map函数(支持continue和break操作), 可用于insert tree item 和 remove tree item
 *
 * 可遍历任何带有 length 属性和数字键的类数组对象
 * @param {ArrayLike<V>} tree  树形数据
 * @param {Function} iterator  迭代函数, 返回值为true时continue, 返回值为false时break
 * @param {string} children 定制子元素的key
 * @param {boolean} isReverse  是否反向遍历
 * @returns {any[]} 新的一棵树
 */
export function mapDeep<T>(
  tree: T[],
  iterator: (
    val: T,
    i: number,
    currentArr: T[],
    tree: T[],
    parent: T | null,
    level: number
  ) => { [k: string | number]: any } | boolean,
  children: string = 'children',
  isReverse = false
): any[] {
  let isBreak = false;
  const newTree = [];
  const walk = (arr: T[], parent: T | null, newTree: any[], level = 0) => {
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
        newTree.push(objectOmit(re, [children as any]));
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
        newTree.push(objectOmit(re, [children as any]));
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

  // @ts-ignore
  tree = null;
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
 * 扁平化数组转换成树
 * @param {any[]} list
 * @param {IFieldOptions} options
 * @returns {any[]}
 */
export function formatTree(list: any[], options: IFieldOptions = defaultFieldOptions): any[] {
  const { keyField, childField, pidField } = options;
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
 * @param {any} treeList
 * @param {IFieldOptions} options
 * @returns {*}
 */
export function flatTree(treeList: any[], options: IFieldOptions = defaultFieldOptions): any[] {
  const { childField, keyField, pidField } = options;
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
 * @param {ISearchTreeOpts} options
 * @returns {V[]}
 */
export function fuzzySearchTree<V>(
  nodes: V[],
  filterCondition: IFilterCondition<V>,
  options: ISearchTreeOpts = defaultSearchTreeOptions
): V[] {
  if (
    !objectHas(filterCondition, 'filter') &&
    (!objectHas(filterCondition, 'keyword') || isEmpty(filterCondition.keyword))
  ) {
    return nodes;
  }
  const result: V[] = [];

  arrayEach(nodes, node => {
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
  });
  return result;
}
