import { concurrentLimit, ConcurrentExecutor, type ProgressInfo } from '../src/concurrentLimit';

describe('concurrentLimit', () => {
  // 模拟异步任务
  const createTask = (duration, result, shouldReject = false) => {
    return () =>
      new Promise((resolve, reject) => {
        setTimeout(() => {
          if (shouldReject) {
            reject(new Error(result));
          } else {
            resolve(result);
          }
        }, duration);
      });
  };

  test('应该按顺序返回所有结果', async () => {
    const tasks = [createTask(100, 'task1'), createTask(50, 'task2'), createTask(30, 'task3'), createTask(10, 'task4')];

    const results = await concurrentLimit(tasks, 2);

    expect(results).toHaveLength(4);
    expect(results.map(r => r.value)).toEqual(['task1', 'task2', 'task3', 'task4']);
  });

  test('应该正确处理错误', async () => {
    const tasks = [createTask(50, 'task1'), createTask(30, 'error', true), createTask(100, 'task3')];

    const results = await concurrentLimit(tasks, 2);

    expect(results[0]).toEqual({ status: 'fulfilled', value: 'task1' });
    expect(results[1]).toEqual({ status: 'rejected', reason: new Error('error') });
    expect(results[2]).toEqual({ status: 'fulfilled', value: 'task3' });
  });

  test('应该限制并发数', async () => {
    let activeCount = 0;
    let maxActive = 0;

    const tasks = Array.from({ length: 10 }, (_, i) => async () => {
      activeCount++;
      maxActive = Math.max(maxActive, activeCount);
      await new Promise(resolve => setTimeout(resolve, 50));
      activeCount--;
      return i;
    });

    await concurrentLimit(tasks, 3);
    expect(maxActive).toBeLessThanOrEqual(3);
  });

  test('应该处理空任务数组', async () => {
    const results = await concurrentLimit([], 5);
    expect(results).toEqual([]);
  });

  test('应该验证参数类型', async () => {
    await expect(concurrentLimit(null, 5)).rejects.toThrow('tasks must be an array of functions');
    await expect(concurrentLimit([], 'invalid')).rejects.toThrow('limit must be a positive number');
    await expect(concurrentLimit([null], 5)).rejects.toThrow('task at index 0 must be a function');
  });

  test('应该保证结果顺序与输入顺序一致', async () => {
    const tasks = [
      createTask(200, 'slow'),
      createTask(50, 'fast1'),
      createTask(100, 'medium'),
      createTask(10, 'fast2')
    ];

    const results = await concurrentLimit(tasks, 2);
    const values = results.map(r => r.value);

    expect(values).toEqual(['slow', 'fast1', 'medium', 'fast2']);
  });
});

describe('ConcurrentExecutor', () => {
  test('应该正确执行任务并返回结果', async () => {
    const executor = new ConcurrentExecutor(2);

    executor.add(() => new Promise(resolve => setTimeout(() => resolve('task1'), 100)));
    executor.add(() => new Promise(resolve => setTimeout(() => resolve('task2'), 50)));

    const results = await executor.run();
    expect(results).toHaveLength(2);
  });

  test('应该支持进度回调', async () => {
    const progressLog: ProgressInfo[] = [];
    const executor = new ConcurrentExecutor(2);

    executor.onProgress = progress => {
      progressLog.push(progress);
    };

    for (let i = 0; i < 4; i++) {
      executor.add(() => new Promise(resolve => setTimeout(() => resolve(i), 20)));
    }

    await executor.run();

    expect(progressLog.length).toBeGreaterThan(0);
    expect(progressLog[progressLog.length - 1].completed).toBe(4);
  });

  test('应该支持任务完成回调', async () => {
    const completedTasks = [];
    const executor = new ConcurrentExecutor(2);

    executor.onTaskComplete = (taskId, result) => {
      completedTasks.push({ taskId, result });
    };

    executor.add(() => Promise.resolve('task1'));
    executor.add(() => Promise.reject(new Error('task2 error')));

    await executor.run();

    expect(completedTasks).toHaveLength(2);
    expect(completedTasks[0].result.value).toBe('task1');
    expect(completedTasks[1].result.reason.message).toBe('task2 error');
  });

  test('应该支持停止执行', async () => {
    const executor = new ConcurrentExecutor(1);

    executor.add(() => new Promise(resolve => setTimeout(() => resolve('task1'), 100)));
    executor.add(() => new Promise(resolve => setTimeout(() => resolve('task2'), 100)));

    // 延迟停止
    setTimeout(() => executor.stop(), 50);

    await expect(executor.run()).rejects.toThrow('Execution was stopped');
  });

  test('应该批量添加任务', () => {
    const executor = new ConcurrentExecutor(3);
    const tasks = [() => Promise.resolve(1), () => Promise.resolve(2), () => Promise.resolve(3)];

    const ids = executor.addAll(tasks);
    expect(ids).toEqual([0, 1, 2]);
  });

  test('应该清空队列', async () => {
    const executor = new ConcurrentExecutor(2);

    executor.add(() => Promise.resolve('task1'));
    executor.add(() => Promise.resolve('task2'));
    executor.clear();

    // 清空后应该没有任务可执行
    const results = await executor.run();
    expect(results).toEqual([]);
  });

  test('应该处理混合成功和失败的任务', async () => {
    const executor = new ConcurrentExecutor(2);

    executor.add(() => Promise.resolve('success'));
    executor.add(() => Promise.reject(new Error('failure')));
    executor.add(() => Promise.resolve('another success'));

    const results = await executor.run();

    expect(results).toHaveLength(3);
    expect(results[0].status).toBe('fulfilled');
    expect(results[1].status).toBe('rejected');
    expect(results[2].status).toBe('fulfilled');
  });
});

// 性能测试
describe('性能测试', () => {
  test('大量任务处理', async () => {
    const startTime = Date.now();
    const taskCount = 1000;
    const concurrencyLimit = 10;

    const tasks = Array.from({ length: taskCount }, (_, i) => () => Promise.resolve(i));

    const results = await concurrentLimit(tasks, concurrencyLimit);

    const duration = Date.now() - startTime;
    console.log(`处理 ${taskCount} 个任务，并发数 ${concurrencyLimit}，耗时 ${duration}ms`);

    expect(results).toHaveLength(taskCount);

    // 验证所有任务都已完成
    results.forEach((result, i) => {
      expect(result.status).toBe('fulfilled');
      expect(result.value).toBe(i);
    });
  }, 30000); // 设置较长的超时时间

  test('模拟真实I/O场景', async () => {
    const mockIOTask = id => async () => {
      // 模拟I/O延迟
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
      return { id, data: `data-${id}` };
    };

    const tasks = Array.from({ length: 50 }, (_, i) => mockIOTask(i));

    const executor = new ConcurrentExecutor(5);
    // Add tasks to the executor
    tasks.forEach(task => executor.add(task));
    const results = await executor.run();

    expect(results).toHaveLength(50);

    // 验证所有任务都返回了正确格式
    results.forEach((result, i) => {
      expect(result.status).toBe('fulfilled');
      expect(result.value).toEqual({ id: i, data: `data-${i}` });
    });
  }, 10000);
});

// 边缘情况测试
describe('边缘情况', () => {
  test('并发数大于任务数', async () => {
    const tasks = [() => Promise.resolve('task1'), () => Promise.resolve('task2')];

    const results = await concurrentLimit(tasks, 10);
    expect(results).toHaveLength(2);
  });

  test('单个任务耗时极长', async () => {
    const tasks = [
      () => new Promise(resolve => setTimeout(() => resolve('slow'), 500)),
      () => Promise.resolve('fast1'),
      () => Promise.resolve('fast2')
    ];

    const results = await concurrentLimit(tasks, 1); // 串行执行

    expect(results).toHaveLength(3);
    expect(results[0].value).toBe('slow');
    expect(results[1].value).toBe('fast1');
    expect(results[2].value).toBe('fast2');
  }, 1000);

  test('任务函数抛出同步错误', async () => {
    const tasks = [
      () => Promise.resolve('ok'),
      () => {
        throw new Error('sync error');
      },
      () => Promise.resolve('ok2')
    ];

    const results = await concurrentLimit(tasks, 2);

    expect(results[0].status).toBe('fulfilled');
    expect(results[1].status).toBe('rejected');
    expect(results[2].status).toBe('fulfilled');
  });

  test('任务取消后的清理', async () => {
    const executor = new ConcurrentExecutor(2);

    executor.add(() => new Promise(resolve => setTimeout(() => resolve('task1'), 200)));
    executor.add(() => new Promise(resolve => setTimeout(() => resolve('task2'), 200)));

    // 立即停止
    executor.stop();

    await expect(executor.run()).rejects.toThrow('Executor has been stopped');

    // 验证状态已重置
    expect(executor.active.size).toBe(0);
    expect(executor.queue.length).toBe(0);
  });
});
