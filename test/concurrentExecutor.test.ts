// import { RetryTimeoutOnlyStrategy } from '../src/defaultFailureStrategy';
import { ConcurrentExecutor, RetryTimeoutOnlyStrategy } from '../src/concurrentExecutor';

const delay = ms => new Promise(r => setTimeout(r, ms));
// --- 模拟任务工厂 ---
const createTask = (ms, value = 'done') => jest.fn(() => new Promise(resolve => setTimeout(() => resolve(value), ms)));
const createFailTask = (ms, errorMsg) =>
  jest.fn(() => new Promise((_, reject) => setTimeout(() => reject(new Error(errorMsg)), ms)));

describe('ConcurrentExecutor', () => {
  // beforeEach(() => {
  //   jest.useFakeTimers();
  // });

  // afterEach(() => {
  //   jest.useRealTimers();
  // });

  test('basic execution with concurrency limit', async () => {
    const order = [];
    const executor = new ConcurrentExecutor({
      concurrency: 2,
      onAllComplete: () => {
        console.log('all done');
      }
    });

    executor.add(async () => {
      await delay(50);
      order.push(1);
      return 1;
    });

    executor.add(async () => {
      await delay(10);
      order.push(2);
      return 2;
    });

    executor.add(async () => {
      order.push(3);
      return 3;
    });

    await delay(100);
    expect(order).toEqual([2, 3, 1]);
  });

  test('pause and resume', async () => {
    const result = [];
    const executor = new ConcurrentExecutor({ autoStart: false });

    executor.add(async () => result.push(1));
    executor.add(async () => result.push(2));

    executor.pause();
    executor.resume();

    await delay(20);
    expect(result).toEqual([1, 2]);
  });

  test('并发控制：限制同时运行的任务数量', async () => {
    const exec = new ConcurrentExecutor({ concurrency: 2 });
    const mockFn = jest.fn();

    // 添加3个任务，每个耗时 1000ms
    const tasks = [1, 2, 3].map(
      i => () =>
        new Promise(r =>
          setTimeout(() => {
            mockFn(i);
            r(i);
          }, 300)
        )
    );

    exec.addAll(tasks);

    // 初始状态：Active=2 (task 1,2), Queue=1 (task 3)
    expect(exec.runningCount).toBe(2);

    // 快进 500ms，任务未完成
    await delay(150);
    expect(mockFn).not.toHaveBeenCalled();

    // 快进到 1000ms，前两个完成
    await delay(450);

    // expect(mockFn).toHaveBeenCalledTimes(2);
    // expect(exec.getResults()).toEqual([1, 2]);
    // 快进到 2000ms，全部完成
    await delay(450);
    expect(mockFn).toHaveBeenCalledTimes(3);
    expect(exec.runningCount).toBe(0);
    expect(exec.results).toEqual([1, 2, 3]);
  });

  test('stop prevents pending tasks', async () => {
    const executor = new ConcurrentExecutor({ concurrency: 1 });

    executor.add(async () => delay(50));
    executor.add(async () => 2);
    executor.stop();

    await delay(60);
    expect(executor.snapshot().tasks.some(t => t.status === 'stopped')).toBe(true);
  });

  test('progress callback works', async () => {
    const progress = [];
    const executor = new ConcurrentExecutor({
      onProgress: task => progress.push(task.progress)
    });

    executor.add(async ({ reportProgress }) => {
      reportProgress(0.5);
      reportProgress(1);
    });

    await delay(10);
    expect(progress).toEqual([0.5, 1]);
  });

  test('sync error is captured', async () => {
    const executor = new ConcurrentExecutor();

    executor.add(() => {
      throw new Error('sync error');
    });

    await delay(10);
    const task = executor.snapshot().tasks[0];
    expect(task.status).toBe('error');
  });

  test('async error is captured', async () => {
    const executor = new ConcurrentExecutor();

    executor.add(async () => {
      await delay(5);
      throw new Error('async error');
    });

    await delay(20);
    const task = executor.snapshot().tasks[0];
    expect(task.status).toBe('error');
  });

  test('onAllComplete called with snapshot', async () => {
    let snapshot;
    const executor = new ConcurrentExecutor({
      onAllComplete: s => (snapshot = s)
    });

    executor.add(() => 1);
    executor.add(() => 2);

    await delay(10);
    expect(snapshot.results.length).toBe(2);
  });

  test('results are strictly ordered', async () => {
    const executor = new ConcurrentExecutor<number>({ concurrency: 2 });

    executor.add(async () => {
      await delay(30);
      return 1;
    });

    executor.add(async () => {
      await delay(5);
      return 2;
    });

    executor.add(async () => 3);

    await delay(100);
    expect(executor['snapshot']().results).toEqual([1, 2, 3]);
  });

  test('task timeout triggers timeout status', async () => {
    const executor = new ConcurrentExecutor({
      timeout: 20
    });

    executor.add(async ({ signal }) => {
      return new Promise((resolve, reject) => {
        const t = setTimeout(() => resolve(1), 50);
        signal.addEventListener('abort', () => {
          clearTimeout(t);
          reject(new Error('aborted'));
        });
      });
    });

    await new Promise(r => setTimeout(r, 100));

    const task = executor['snapshot']().tasks[0];
    expect(task.status).toBe('timeout');
  });

  test('retry eventually succeeds', async () => {
    let count = 0;

    const executor = new ConcurrentExecutor({
      retry: 2
    });

    executor.add(() => {
      if (++count < 2) throw new Error('fail');
      return 42;
    });

    await delay(50);
    expect(executor['snapshot']().results[0]).toBe(42);
  });

  test('pause prevents execution', async () => {
    const executor = new ConcurrentExecutor({ autoStart: false });

    executor.add(() => 1);
    executor.pause();

    await delay(20);
    expect(executor['snapshot']().runningCount).toBe(0);
  });

  test('stop marks pending tasks as stopped', async () => {
    const executor = new ConcurrentExecutor({
      concurrency: 2,
      onTaskComplete(task, snapshot) {
        console.log('onTaskComplete');
      }
    });

    executor.add(async () => delay(50));
    executor.add(() => 2);
    executor.add(() => 3);

    executor.stop();
    await delay(30);

    const tasks = executor['snapshot']().tasks;
    expect(tasks.some(t => t.status === 'stopped')).toBe(true);
  });

  test('constructor default options', () => {
    const executor = new ConcurrentExecutor();
    const snapshot = (executor as any).snapshot();
    expect(snapshot.runningCount).toBe(0);
  });

  test('resume does nothing if not paused', () => {
    const executor = new ConcurrentExecutor();
    executor.resume(); // 不应抛错
  });

  test('resume does nothing if stopped', () => {
    const executor = new ConcurrentExecutor();
    executor.pause();
    executor.stop();
    executor.resume();
  });
  test('schedule exits gracefully when queue is empty', () => {
    const executor = new ConcurrentExecutor();
    (executor as any).schedule();
  });

  test('retry path returns early and reschedules', async () => {
    let count = 0;
    const executor = new ConcurrentExecutor({
      retry: 1,
      retryDelay: 0
    });

    executor.add(() => {
      if (++count === 1) throw new Error('fail');
      return 1;
    });

    await new Promise(r => setTimeout(r, 50));
    const snapshot = (executor as any).snapshot();
    expect(snapshot.results[0]).toBe(1);
  });

  test('onAllComplete not triggered until all tasks finish', async () => {
    const spy = jest.fn();

    const executor = new ConcurrentExecutor({
      concurrency: 1,
      onAllComplete: spy
    });

    executor.add(async () => new Promise(r => setTimeout(r, 30)));
    executor.add(() => 2);

    await new Promise(r => setTimeout(r, 10));
    expect(spy).not.toHaveBeenCalled();
  });

  // timeout → retry → success
  test('timeout then retry succeeds', async () => {
    let count = 0;

    const executor = new ConcurrentExecutor({
      timeout: 20,
      retry: 1
    });

    executor.add(async ({ signal }) => {
      count++;
      if (count === 1) {
        await new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error())));
      }
      return 42;
    });

    await new Promise(r => setTimeout(r, 100));
    // const snapshot = (executor as any).snapshot();
    // expect(snapshot.results[0]).toBe(42);

    const snapshot = executor['snapshot']();
    expect(snapshot.tasks[0].retries).toBe(1);
    expect(snapshot.tasks[0].status).toBe('success');
    expect(snapshot.results[0]).toBe(42);
  });

  test('stop only marks pending tasks', async () => {
    const executor = new ConcurrentExecutor({ concurrency: 1 });

    executor.add(async () => new Promise(r => setTimeout(r, 50)));
    executor.add(() => 2);

    await new Promise(r => setTimeout(r, 10));
    executor.stop();

    const tasks = (executor as any).snapshot().tasks;
    expect(tasks.some(t => t.status === 'stopped')).toBe(true);
  });

  // 1️⃣ retry + timeout 成功
  test('custom strategy retries only timeout', async () => {
    let count = 0,
      count2 = 0;

    const executor = new ConcurrentExecutor({
      timeout: 10,
      failureStrategy: new RetryTimeoutOnlyStrategy(2)
    });

    executor.add(function (ctx) {
      count++;
      if (count === 1) {
        return new Promise(function (_, reject) {
          ctx.signal.addEventListener('abort', function () {
            reject(new Error('timeout'));
          });
        });
      }
      return 42;
    });

    executor.add(function (ctx) {
      count2++;
      if (count2 <= 3) {
        return new Promise(function (_, reject) {
          ctx.signal.addEventListener('abort', function () {
            reject(new Error('timeout'));
          });
        });
      }
      return 43;
    });

    await new Promise(function (r) {
      setTimeout(r, 100);
    });

    const snapshot = executor['snapshot']();
    expect(snapshot.results[0]).toBe(42);
    expect(snapshot.tasks[1].status).toBe('timeout');
  });
  //2️⃣ error 不 retry
  test('error is not retried by timeout-only strategy', async () => {
    const executor = new ConcurrentExecutor({
      failureStrategy: new RetryTimeoutOnlyStrategy(3)
    });

    executor.add(function () {
      throw new Error('boom');
    });

    await new Promise(function (r) {
      setTimeout(r, 50);
    });

    const task = executor['snapshot']().tasks[0];
    expect(task.retries).toBe(0);
    expect(task.status).toBe('error');
  });

  test('add stores task meta correctly', async () => {
    const executor = new ConcurrentExecutor<number>();

    executor.add(() => 1, { id: 't1' });

    await new Promise(r => setTimeout(r, 10));

    const snapshot = (executor as any).snapshot();
    expect(snapshot.tasks[0].meta).toEqual({ id: 't1' });
  });

  test('addAllWithMeta adds tasks with corresponding meta', async () => {
    const executor = new ConcurrentExecutor<number>();

    executor.addAllWithMeta([
      { taskFn: () => 1, meta: { name: 'a' } },
      { taskFn: () => 2, meta: { name: 'b' } },
      { taskFn: () => 3 }
    ]);

    await new Promise(r => setTimeout(r, 20));

    const snapshot = (executor as any).snapshot();

    expect(snapshot.tasks.length).toBe(3);
    expect(snapshot.tasks[0].meta).toEqual({ name: 'a' });
    expect(snapshot.tasks[1].meta).toEqual({ name: 'b' });
    expect(snapshot.tasks[2].meta).toBeUndefined();
  });

  test('meta is available when task times out', async () => {
    const executor = new ConcurrentExecutor({
      timeout: 10
    });

    executor.add(
      ({ signal }) =>
        new Promise((_, reject) => {
          signal.addEventListener('abort', () => {
            reject(new Error('timeout'));
          });
        }),
      { fileId: 'f-123' }
    );

    await new Promise(r => setTimeout(r, 50));

    const task = (executor as any).snapshot().tasks[0];

    expect(task.status).toBe('timeout');
    expect(task.meta).toEqual({ fileId: 'f-123' });
  });
  //1️⃣ start() 能触发执行
  test('start manually triggers execution', async () => {
    const executor = new ConcurrentExecutor<number>({
      autoStart: false
    });

    executor.add(() => 1);
    executor.add(() => 2);

    executor.start();

    await new Promise(r => setTimeout(r, 20));

    expect((executor as any).snapshot().results).toEqual([1, 2]);
  });

  //1️⃣ start() 能触发执行
  test('destroy cancels pending tasks', async () => {
    const executor = new ConcurrentExecutor<number>({
      concurrency: 1
    });

    executor.add(async () => {
      await new Promise(r => setTimeout(r, 50));
      return 1;
    });

    executor.add(() => 2);

    setTimeout(() => executor.destroy(), 10);

    await new Promise(r => setTimeout(r, 100));

    const snapshot = (executor as any).snapshot();

    expect(snapshot.tasks[1].status).toBe('cancelled');
  });
  //3️⃣ destroy 后 start / add 无效（幂等安全）
  test('executor is unusable after destroy', async () => {
    const executor = new ConcurrentExecutor<number>();

    executor.destroy();

    executor.add(() => 1);
    executor.start();

    await new Promise(r => setTimeout(r, 20));

    const snapshot = (executor as any).snapshot();
    expect(snapshot.tasks.length).toBe(0);
  });
  //destroy 后 addAllWithMeta 是 no-op
  test('addAllWithMeta is no-op after destroy', async () => {
    const executor = new ConcurrentExecutor<number>();

    executor.destroy();
    executor.addAll([() => 1]);
    executor.addAllWithMeta([{ taskFn: () => 1, meta: { a: 1 } }]);
    executor.destroy();
    if (!executor.isDestroyed()) {
      executor.add(() => 1);
    }

    const snapshot = (executor as any).snapshot();
    expect(snapshot.tasks.length).toBe(0);
  });

  //1️⃣ destroy 会 abort running task
  test('destroy aborts running task', async () => {
    let aborted = false;

    const executor = new ConcurrentExecutor({
      concurrency: 1
    });

    executor.add(({ signal }) => {
      signal.addEventListener('abort', () => {
        aborted = true;
      });
      return new Promise(() => {});
    });

    setTimeout(() => executor.destroy(), 10);

    await new Promise(r => setTimeout(r, 30));

    expect(aborted).toBe(true);

    const task = (executor as any).snapshot().tasks[0];
    expect(task.status).toBe('cancelled');
  });
});
