import { objectHas } from './object';
import { AnyArray, isArray, isObject, isString } from './type';

/**
 * 判断一个对象是否为类数组
 *
 * @param any
 * @returns {boolean}
 */
export function arrayLike(any: unknown): boolean {
  if (isArray(any)) return true;

  if (isString(any)) return true;

  if (!isObject(any)) return false;

  return objectHas(any, 'length');
}

/**
 * 遍历数组，返回 false 中断遍历
 *
 * @param {ArrayLike<V>} array
 * @param {(val: V, idx: number) => any} iterator
 * @param reverse {boolean} 是否倒序
 * @returns {*}
 */
export function arrayEach<V>(
  array: ArrayLike<V>,
  iterator: (val: V, idx: number, arr: ArrayLike<V>) => any,
  reverse = false
): void {
  if (reverse) {
    for (let idx = array.length - 1; idx >= 0; idx--) {
      const val = array[idx];

      if (iterator(val, idx, array) === false) break;
    }
  } else {
    for (let idx = 0; idx < array.length; idx++) {
      const val = array[idx];

      if (iterator(val, idx, array) === false) break;
    }
  }
}

/**
 * 异步遍历数组，返回 false 中断遍历
 * @param {ArrayLike<V>} array 数组
 * @param {(val: V, idx: number) => Promise<any>} iterator  支持Promise类型的回调函数
 * @param {boolean} reverse  是否反向遍历
 */
export async function arrayEachAsync<V>(
  array: ArrayLike<V>,
  iterator: (val: V, idx: number) => Promise<any> | any,
  reverse = false
): Promise<void> {
  if (reverse) {
    for (let idx = array.length - 1; idx >= 0; idx--) {
      const val = array[idx];

      if ((await iterator(val, idx)) === false) break;
    }
  } else {
    for (let idx = 0; idx < array.length; idx++) {
      const val = array[idx];

      if ((await iterator(val, idx)) === false) break;
    }
  }
}

/**
 * 插入到目标位置之前
 * @param {AnyArray} array
 * @param {number} start
 * @param {number} to
 * @returns {*}
 */
export function arrayInsertBefore(array: AnyArray, start: number, to: number): void {
  if (start === to || start + 1 === to) return;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [source] = array.splice(start, 1);
  const insertIndex = to < start ? to : to - 1;

  array.splice(insertIndex, 0, source);
}

/**
 * 数组删除指定项目
 * @param {V[]} array
 * @param {(val: V, idx: number) => boolean} expect
 * @returns {V[]}
 */
export function arrayRemove<V>(array: V[], expect: (val: V, idx: number) => boolean): V[] {
  const indexes: number[] = [];
  // 这里重命名一下：是为了杜绝 jest 里的 expect 与之产生检查错误
  // eslint 的 jest 语法检查是遇到 expect 函数就以为是单元测试
  const _expect = expect;

  arrayEach(array, (val, idx) => {
    if (_expect(val, idx)) indexes.push(idx);
  });

  indexes.forEach((val, idx) => array.splice(val - idx, 1));

  return array;
}

/**
 * 自定义深度优先遍历函数(支持continue和break操作)
 * @param {ArrayLike<V>} tree  树形数据
 * @param {Function} iterator  迭代函数
 * @param {string} children 定制子元素的key
 * @param {boolean} isReverse  是否反向遍历
 * @returns {*}
 */
export function deepTraversal<V>(
  tree: ArrayLike<V>,
  iterator: (val: V, i: number, arr: ArrayLike<V>, parent: V | null, level: number) => any,
  children: string = 'children',
  isReverse = false
) {
  let level = 0;
  const walk = (arr: ArrayLike<V>, parent: V | null) => {
    if (isReverse) {
      for (let i = arr.length - 1; i >= 0; i--) {
        const re = iterator(arr[i], i, tree, parent, level);
        if (re === 'break') {
          break;
        } else if (re === 'continue') {
          continue;
        }
        // @ts-ignore
        if (Array.isArray(arr[i][children])) {
          ++level;
          // @ts-ignore
          walk(arr[i][children], arr[i]);
        }
      }
    } else {
      for (let i = 0; i < arr.length; i++) {
        const re = iterator(arr[i], i, tree, parent, level);
        if (re === 'break') {
          break;
        } else if (re === 'continue') {
          continue;
        }
        // @ts-ignore
        if (Array.isArray(arr[i][children])) {
          ++level;
          // @ts-ignore
          walk(arr[i][children], arr[i]);
        }
      }
    }
  };
  walk(tree, null);
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
export function getTreeIds<V>(tree: ArrayLike<V>, nodeId: IdLike, config?: ITreeConf): [IdLike[], ArrayLike<V>[]] {
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
 * 异步ForEach函数
 * @param {array} array
 * @param {asyncFuntion} callback
 * // asyncForEach 使用范例如下
// const start = async () => {
//   await asyncForEach(result, async (item) => {
//     await request(item);
//     count++;
//   });

//   console.log('发送次数', count);
// }

// for await...of 使用范例如下
// const loadImages =  async (images) => {
//   for await (const item of images) {
//      await request(item);
//      count++;
//    }
// }
 * @returns {*}
 */
async function asyncForEach(array: any[], callback: Function) {
  for (let index = 0, len = array.length; index < len; index++) {
    await callback(array[index], index, array);
  }
}
