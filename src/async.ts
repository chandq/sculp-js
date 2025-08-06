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

/**
 * Execute a promise safely
 *
 * @param { Promise } promise
 * @param { Object= } errorExt - Additional Information you can pass to the err object
 * @return { Promise }
 * @example
 * async function asyncTaskWithCb(cb) {
     let err, user, savedTask, notification;

     [ err, user ] = await to(UserModel.findById(1));
     if(!user) return cb('No user found');

     [ err, savedTask ] = await to(TaskModel({userId: user.id, name: 'Demo Task'}));
     if(err) return cb('Error occurred while saving task')

    cb(null, savedTask);
}
 */
export function safeAwait<T, U = Error>(promise: Promise<T>, errorExt?: object): Promise<[U, undefined] | [null, T]> {
  return promise
    .then<[null, T]>((data: T) => [null, data])
    .catch<[U, undefined]>((err: U) => {
      if (errorExt) {
        const parsedError = Object.assign({}, err, errorExt);
        return [parsedError, undefined];
      }

      return [err, undefined];
    });
}
