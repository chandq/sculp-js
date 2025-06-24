import { AnyArray, isArray, isObject } from './type';

/**
 * 遍历数组，返回 false 中断遍历(支持continue和break操作)
 *
 * @param {ArrayLike<V>} array
 * @param {(val: V, idx: number) => any} iterator 迭代函数, 返回值为true时continue, 返回值为false时break
 * @param {boolean} reverse  是否倒序
 * @returns {*}
 */
export function arrayEach<V>(
  array: ArrayLike<V>,
  iterator: (val: V, idx: number, arr: ArrayLike<V>) => boolean | void,
  reverse = false
): void {
  if (reverse) {
    for (let idx = array.length - 1; idx >= 0; idx--) {
      const re = iterator(array[idx], idx, array);
      if (re === false) break;
      else if (re === true) continue;
    }
  } else {
    for (let idx = 0, len = array.length; idx < len; idx++) {
      const re = iterator(array[idx], idx, array);
      if (re === false) break;
      else if (re === true) continue;
    }
  }
  // @ts-ignore
  array = null;
}

/**
 * 异步遍历数组，返回 false 中断遍历
 * @param {ArrayLike<V>} array 数组
 * @param {(val: V, idx: number) => Promise<any>} iterator  支持Promise类型的回调函数
 * @param {boolean} reverse  是否反向遍历
 * @example
 *    使用范例如下:
 * const start = async () => {
 *   await arrayEachAsync(result, async (item) => {
 *     await request(item);
 *     count++;
 *   })
 *   console.log('发送次数', count);
 * }

 * for await...of 使用范例如下
 * const loadImages =  async (images) => {
 *   for await (const item of images) {
 *      await request(item);
 *      count++;
 *    }
 * }
 */
export async function arrayEachAsync<V>(
  array: ArrayLike<V>,
  iterator: (val: V, idx: number) => Promise<any> | any,
  reverse = false
): Promise<void> {
  if (reverse) {
    for (let idx = array.length - 1; idx >= 0; idx--) {
      if ((await iterator(array[idx], idx)) === false) break;
    }
  } else {
    for (let idx = 0, len = array.length; idx < len; idx++) {
      if ((await iterator(array[idx], idx)) === false) break;
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

  indexes.forEach((val, idx) => {
    array.splice(val - idx, 1);
  });

  return array;
}
