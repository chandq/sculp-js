let startTime;
let startMemory;
let i = 0;

beforeEach(() => {
  // 记录测试开始前的性能数据
  startTime = Date.now();
  startMemory = process.memoryUsage().heapUsed;
});

afterEach(() => {
  // 计算测试性能
  const duration = Date.now() - startTime;
  const memoryUsed = (process.memoryUsage().heapUsed - startMemory) / (1024 * 1024);

  // 输出性能数据
  console.log(`【${++i}】：测试执行时间: ${duration}ms, 内存占用: ${memoryUsed.toFixed(2)}MB`);

  // 标记慢测试
  if (duration > 500) {
    console.warn('警告: 此测试执行时间超过500ms');
  }
});
