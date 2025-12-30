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

export interface TaskInfo<T> {
  task: () => Promise<T> | T;
  meta: any;
  id: number;
}

export interface ProgressInfo {
  completed: number;
  total: number;
  active: number;
  percent: number;
}

export interface TaskResult<T> {
  status: 'fulfilled' | 'rejected';
  value?: T;
  reason?: any;
}

/**
 * 增强版：支持取消和进度回调
 */
class ConcurrentExecutor<T = any> {
  private limit: number;

  private active: Map<number, Promise<any>>;

  private queue: TaskInfo<T>[];

  private results: Array<TaskResult<T>> | null;

  private isStopped: boolean;

  public onProgress: ((progress: ProgressInfo) => void) | null;

  public onTaskComplete: ((taskId: number, result: TaskResult<T>) => void) | null;

  constructor(limit = 5) {
    this.limit = limit;
    this.active = new Map();
    this.queue = [];
    this.results = [];
    this.isStopped = false;
    this.onProgress = null;
    this.onTaskComplete = null;
  }

  /**
   * 添加任务
   * @param {Function} task - 返回Promise的任务函数
   * @param {any} meta - 任务元数据
   */
  add(task, meta = {}) {
    const taskId = this.queue.length;
    this.queue.push({ task, meta, id: taskId });
    return taskId;
  }

  /**
   * 批量添加任务
   */
  addAll(tasks) {
    return tasks.map((task, i) => this.add(task, { index: i }));
  }

  /**
   * 执行所有任务
   */
  async run() {
    if (this.isStopped) {
      throw new Error('Executor has been stopped');
    }

    this.results = new Array(this.queue.length);
    let completed = 0;

    // 更新进度
    const updateProgress = () => {
      if (this.onProgress) {
        this.onProgress({
          completed,
          total: this.queue.length,
          active: this.active.size,
          percent: (completed / this.queue.length) * 100
        });
      }
    };

    // 执行单个任务
    const runTask = async taskInfo => {
      if (this.isStopped) return;

      const { task, id, meta } = taskInfo;
      const taskPromise = Promise.resolve().then(() => task(meta));

      this.active.set(id, taskPromise);

      try {
        const result = await taskPromise;
        this.results![id] = { status: 'fulfilled', value: result };
      } catch (error) {
        this.results![id] = { status: 'rejected', reason: error };
      } finally {
        this.active.delete(id);
        completed++;
        updateProgress();

        if (this.onTaskComplete) {
          this.onTaskComplete(id, this.results![id]);
        }

        // 执行队列中的下一个任务
        if (this.queue.length > 0 && !this.isStopped) {
          const nextTask = this.queue.shift();
          runTask(nextTask);
        }
      }
    };

    // 启动初始任务
    const initialTasks = this.queue.splice(0, this.limit);
    initialTasks.forEach(runTask);

    // 等待所有任务完成
    while (this.active.size > 0 && !this.isStopped) {
      await Promise.race(this.active.values());
    }

    if (this.isStopped) {
      throw new Error('Execution was stopped');
    }

    return this.results;
  }

  /**
   * 停止执行
   */
  stop() {
    this.isStopped = true;
    this.active.clear();
    this.queue = [];
  }

  /**
   * 清空队列
   */
  clear() {
    this.queue = [];
  }
}
export { concurrentLimit, ConcurrentExecutor };
