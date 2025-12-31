// import { DefaultFailureStrategy, FailureStrategy } from './defaultFailureStrategy';
import { isBoolean, isNumber } from './type';

export type TaskStatus = 'pending' | 'running' | 'success' | 'error' | 'timeout' | 'stopped' | 'cancelled';

export interface TaskContext<T = unknown> {
  reportProgress: (progress: number) => void;
  signal: AbortSignal;
}

export interface Task<T = unknown> {
  id: number;
  index: number;
  status: TaskStatus;
  controller?: AbortController;
  progress: number;
  retries: number;
  startTime?: number;
  endTime?: number;
  result?: T;
  error?: unknown;
  meta?: unknown;
  taskFn: (ctx: TaskContext<T>) => Promise<T> | T;
}
export type FailureAction = 'retry' | 'fail' | 'timeout';

export interface FailureContext<T> {
  task: Task<T>;
  error: unknown;
  isTimeout: boolean;
}

export interface FailureStrategy<T> {
  onFailure(context: FailureContext<T>): FailureAction;
}

export class DefaultFailureStrategy<T> implements FailureStrategy<T> {
  private maxRetry: number;

  constructor(maxRetry: number) {
    this.maxRetry = maxRetry;
  }

  onFailure(context: FailureContext<T>): FailureAction {
    const task = context.task;

    if (task.retries < this.maxRetry) {
      return 'retry';
    }

    if (context.isTimeout) {
      return 'timeout';
    }

    return 'fail';
  }
}

export class RetryTimeoutOnlyStrategy<T> implements FailureStrategy<T> {
  private maxRetry: number;

  constructor(maxRetry: number) {
    this.maxRetry = maxRetry;
  }

  onFailure(ctx: FailureContext<T>) {
    if (ctx.isTimeout && ctx.task.retries < this.maxRetry) {
      return 'retry';
    }

    if (ctx.isTimeout) {
      return 'timeout';
    }

    return 'fail';
  }
}

export interface ExecutorOptions<T = unknown> {
  concurrency?: number;
  autoStart?: boolean;
  timeout?: number; // ms
  retry?: number; // retry count
  failureStrategy?: FailureStrategy<T>;
  onProgress?: (task: Task<T>, snapshot: Snapshot<T>) => void;
  onTaskComplete?: (task: Task<T>, snapshot: Snapshot<T>) => void;
  onAllComplete?: (snapshot: Snapshot<T>) => void;
}

export interface Snapshot<T = unknown> {
  tasks: Task<T>[];
  results: Array<T | undefined>;
  successCount: number;
  runningCount: number;
}
/**
 * ConcurrentExecutor
 *
 * 一个用于生产环境的并发任务执行器，支持同步 / 异步任务的受控调度，
 * 并提供完整的任务状态、结果收集与失败控制能力。
 *
 * 核心功能：
 * - 并发数控制（concurrency）
 * - 动态添加任务：add / addAllWithMeta
 * - 任务元数据 meta（用于业务关联）
 * - 超时、重试等失败策略
 * - pause / resume / stop 执行控制
 * - 保证结果按任务添加顺序（index）对齐
 * - 捕获同步与异步异常
 * - 可运行于浏览器与 Node.js
 * - 支持手动 start() 触发执行（autoStart = false）
 * - 支持 destroy() 清理任务与资源
 *
 * 设计约束：
 * - 任务完成顺序不保证
 * - 结果顺序始终与添加顺序一致
 * - meta 为非侵入式扩展字段
 *
 * 示例：
 *
 * ```ts
 * const executor = new ConcurrentExecutor<number>({ concurrency: 2 });
 *
 * executor.add(() => 1);
 * executor.add(async () => {
 *   await delay(100);
 *   return 2;
 * }, { id: 'task-2' });
 *
 * executor.onAllComplete = (snapshot) => {
 *   console.log(snapshot.results); // [1, 2]
 * };
 * ```
 */
export class ConcurrentExecutor<T = unknown> {
  private concurrency: number;

  private autoStart: boolean;

  private timeout?: number;

  private retry: number;

  private tasks: Task<T>[] = [];

  private queue: Task<T>[] = [];

  public results: Array<T | undefined> = [];

  public runningCount = 0;

  private successCount = 0;

  private paused = false;

  private stopped = false;

  private idGen = 0;

  private failureStrategy: FailureStrategy<T>;

  private onProgress?: ExecutorOptions<T>['onProgress'];

  private onTaskComplete?: ExecutorOptions<T>['onTaskComplete'];

  private onAllComplete?: ExecutorOptions<T>['onAllComplete'];

  constructor(options: ExecutorOptions<T> = {}) {
    this.concurrency = isNumber(options.concurrency) ? options.concurrency : 5;
    this.autoStart = isBoolean(options.autoStart) ? options.autoStart : true;
    this.timeout = options.timeout;
    this.retry = isNumber(options.retry) ? options.retry : 0;
    this.failureStrategy = options.failureStrategy || new DefaultFailureStrategy<T>(this.retry);

    this.onProgress = options.onProgress;
    this.onTaskComplete = options.onTaskComplete;
    this.onAllComplete = options.onAllComplete;
  }

  add(taskFn: (ctx: TaskContext<T>) => Promise<T> | T, mata?: unknown): number | undefined {
    if (this.stopped) {
      return undefined;
    }
    const index = this.tasks.length;

    const task: Task<T> = {
      id: ++this.idGen,
      index,
      status: 'pending',
      progress: 0,
      retries: 0,
      taskFn,
      meta: mata
    };

    this.tasks.push(task);
    this.queue.push(task);
    this.results[index] = undefined;

    if (this.autoStart && !this.paused && !this.stopped) {
      this.schedule();
    }

    return task.id;
  }

  addAll(taskFns: Array<(ctx: TaskContext<T>) => Promise<T> | T>): void {
    if (this.stopped) {
      return;
    }
    taskFns.forEach(fn => this.add(fn));
  }

  addAllWithMeta(tasks: Array<{ taskFn: (ctx: TaskContext<T>) => Promise<T> | T; meta?: unknown }>): void {
    if (this.stopped) {
      return;
    }
    for (let i = 0; i < tasks.length; i++) {
      this.add(tasks[i].taskFn, tasks[i].meta);
    }
  }

  pause() {
    this.paused = true;
  }

  resume() {
    if (!this.paused || this.stopped) return;
    this.paused = false;
    this.schedule();
  }

  start(): void {
    if (this.stopped) {
      return;
    }
    this.paused = false;
    this.schedule();
  }

  stop() {
    this.stopped = true;
    this.queue.forEach(t => {
      if (t.status === 'pending') t.status = 'stopped';
    });
  }

  private schedule() {
    while (this.runningCount < this.concurrency && !this.paused && !this.stopped) {
      const task = this.queue.shift();
      if (!task) break;
      this.runTask(task);
    }
  }

  private async runTask(task: Task<T>) {
    this.runningCount++;
    task.status = 'running';
    task.startTime = Date.now();

    const controller = new AbortController();
    task.controller = controller;
    let timer: any;

    if (this.timeout) {
      timer = setTimeout(() => {
        controller.abort();
      }, this.timeout);
    }

    const reportProgress = (p: number) => {
      task.progress = p;
      this.onProgress?.(task, this.snapshot());
    };

    try {
      const result = await Promise.resolve(
        this.tasks[task.index].taskFn?.({
          reportProgress,
          signal: controller.signal
        })
      );

      task.status = 'success';
      task.result = result;
      this.results[task.index] = result;
      this.successCount++;
    } catch (err) {
      const isTimeout = controller.signal.aborted;

      const action = this.failureStrategy.onFailure({
        task: task,
        error: err,
        isTimeout: isTimeout
      });

      if (action === 'retry') {
        task.retries++;
        task.status = 'pending';
        this.queue.push(task);
        return;
      }

      if (action === 'timeout') {
        task.status = 'timeout';
        task.error = err;
      } else {
        task.status = 'error';
        task.error = err;
      }
    } finally {
      clearTimeout(timer);
      task.endTime = Date.now();
      this.runningCount--;

      if (task.status !== 'pending') {
        this.onTaskComplete?.(task, this.snapshot());
      }

      this.schedule();

      if (this.isAllFinished()) {
        this.onAllComplete?.(this.snapshot());
      } else {
        this.schedule();
      }
    }
  }

  destroy(): void {
    if (this.stopped) {
      return;
    }

    this.stopped = true;
    this.paused = true;

    // 取消等待队列
    for (let i = 0; i < this.queue.length; i++) {
      const task = this.queue[i];
      task.status = 'cancelled';
      task.endTime = Date.now();
      this.results[task.index] = undefined;
    }
    this.queue.length = 0;

    // ⬇️ 关键：终止运行中的任务
    this.abortRunningTasks();

    // 防止外部误用
    Object.freeze(this.tasks);
    Object.freeze(this.results);

    // 清理回调引用
    this.onProgress = undefined;
    this.onTaskComplete = undefined;
    this.onAllComplete = undefined;
  }

  public isDestroyed(): boolean {
    return this.stopped;
  }

  private abortRunningTasks(): void {
    for (let i = 0; i < this.tasks.length; i++) {
      const task = this.tasks[i];

      if (task.status === 'running' && task.controller) {
        try {
          task.controller.abort();
        } catch (e) {
          // 忽略 abort 本身的异常，保证 destroy 不失败
        }

        task.status = 'cancelled';
        task.endTime = Date.now();
        this.results[task.index] = undefined;
      }
    }
  }

  private isAllFinished() {
    return this.tasks.every(t => ['success', 'error', 'timeout', 'stopped'].includes(t.status));
  }

  public snapshot(): Snapshot<T> {
    return {
      tasks: this.tasks.map(t => ({ ...t })),
      results: [...this.results],
      successCount: this.successCount,
      runningCount: this.runningCount
    };
  }
}
