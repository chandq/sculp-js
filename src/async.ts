/**
 * 等待一段时间
 * @param {number} timeout 等待时间，单位毫秒
 * @returns {Promise<void>}
 */
export function wait(timeout = 1): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, timeout));
}

/**
 * 异步遍历
 * @ref https://github.com/Kevnz/async-tools/blob/master/src/mapper.js
 * @ref https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/@@iterator
 * @param {Array<T>} list
 * @param {(val: T, idx: number, list: ArrayLike<T>) => Promise<R>} mapper
 * @param {number} concurrency 并发数量，默认无限
 * @returns {Promise<R[]>}
 */
export function asyncMap<T, R>(
  list: Array<T>,
  mapper: (val: T, idx: number, list: Array<T>) => Promise<R>,
  concurrency = Infinity
): Promise<R[]> {
  return new Promise((resolve, reject) => {
    const iterator = list[Symbol.iterator]();
    const limit = Math.min(list.length, concurrency);
    const resolves: R[] = [];
    let resolvedLength = 0;
    let rejected: unknown;
    let index = 0;
    const next = () => {
      if (rejected) return reject(rejected);

      const it = iterator.next();

      if (it.done) {
        if (resolvedLength === list.length) resolve(resolves);
        return;
      }

      const current = index++;

      mapper(it.value, current, list)
        .then(value => {
          resolvedLength++;
          resolves[current] = value;
          next();
        })
        .catch(err => {
          rejected = err;
          next();
        });
    };

    // 开始
    for (let i = 0; i < limit; i++) {
      next();
    }
  });
}
