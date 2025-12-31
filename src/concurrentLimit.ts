/**
 * 并发限制执行器
 * @param {Array<Function>} tasks - 返回Promise的任务函数数组
 * @param {number} limit - 最大并发数
 * @returns {Promise<Array>} - 按任务顺序返回结果数组
 */
async function concurrentLimit<T>(
  tasks: Array<() => Promise<T> | T>,
  limit: number
): Promise<Array<{ status: 'fulfilled'; value: T } | { status: 'rejected'; reason: any }>> {
  if (!Array.isArray(tasks)) {
    throw new Error('tasks must be an array of functions');
  }

  if (typeof limit !== 'number' || limit <= 0) {
    throw new Error('limit must be a positive number');
  }

  // Validate each task is a function
  for (let i = 0; i < tasks.length; i++) {
    if (typeof tasks[i] !== 'function') {
      throw new Error(`task at index ${i} must be a function`);
    }
  }

  if (tasks.length === 0) {
    return [];
  }

  const results = new Array(tasks.length);
  let currentIndex = 0;

  return new Promise(resolve => {
    let running = 0;
    let completed = 0;

    const executeNext = () => {
      // 启动新任务直到达到并发限制
      while (running < limit && currentIndex < tasks.length) {
        const taskIndex = currentIndex;
        const task = tasks[currentIndex];
        currentIndex++;
        running++;

        // 将函数包装在 Promise 中以处理同步错误
        Promise.resolve()
          .then(() => task())
          .then(value => {
            results[taskIndex] = { status: 'fulfilled', value } as
              | { status: 'fulfilled'; value: T }
              | { status: 'rejected'; reason: any };
          })
          .catch(reason => {
            results[taskIndex] = { status: 'rejected', reason } as
              | { status: 'fulfilled'; value: T }
              | { status: 'rejected'; reason: any };
          })
          // eslint-disable-next-line no-loop-func
          .finally(() => {
            running--;
            completed++;

            if (completed === tasks.length) {
              resolve(results);
            } else {
              // 继续执行下一个任务
              executeNext();
            }
          });
      }
    };

    // 开始执行
    executeNext();
  });
}

export { concurrentLimit };
