import { concurrentLimit } from '../src/concurrentLimit';

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
