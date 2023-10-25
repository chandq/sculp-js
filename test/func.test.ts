import { debounce, throttle, once, getGlobal, setGlobal } from '../src/func';
import { AnyFunc } from '../src/type';

test('debounce', () => {
  let context: unknown;
  const f = jest.fn(function (...args) {
    context = this;
  });
  const debounced = debounce(f);

  // 不会立即执行
  jest.useFakeTimers();
  debounced.call(1, 2, 3);
  debounced.call(4, 5, 6);
  debounced.call(7, 8, 9);
  expect(f).not.toBeCalled();

  // 到时间后执行最后一次
  jest.runAllTimers();
  expect(f.mock.calls).toHaveLength(1);
  expect(context).toBe(7);
  expect(f).toBeCalledWith(8, 9);

  // 取消后不再执行
  debounced.cancel();
  jest.runAllTimers();
  debounced.call(10, 11, 12);
  debounced.call(13, 14, 15);
  expect(f.mock.calls).toHaveLength(1);
  jest.useRealTimers();
});

test('throttle 默认非立即执行', () => {
  let context: unknown;
  const f = jest.fn(function (...args) {
    context = this;
  });
  const throttled = throttle(f, 1000);

  // 非立即执行
  jest.useFakeTimers();
  throttled.call(1, 2, 3);
  throttled.call(4, 5, 6);
  throttled.call(7, 8, 9);
  expect(f.mock.calls).toHaveLength(0);

  // 超时后
  jest.runAllTimers();
  expect(f.mock.calls).toHaveLength(1);
  throttled.call(10, 11);
  expect(f.mock.calls).toHaveLength(1);
  jest.runAllTimers();
  expect(f.mock.calls).toHaveLength(2);
  expect(f).toBeCalledWith(11);
  expect(context).toEqual(10);

  // 取消后不再执行
  throttled.cancel();
  throttled.call(12, 13);
  expect(f.mock.calls).toHaveLength(2);
  jest.runAllTimers();
  expect(f.mock.calls).toHaveLength(2);
  jest.useRealTimers();
});

test('throttle 立即执行', () => {
  let context: unknown;
  const f = jest.fn(function (...args) {
    context = this;
  });
  const throttled = throttle(f, 1000, true);

  // 立即执行
  jest.useFakeTimers();
  throttled.call(1, 2, 3);
  throttled.call(4, 5, 6);
  throttled.call(7, 8, 9);
  expect(f.mock.calls).toHaveLength(1);
  expect(f).toBeCalledWith(2, 3);
  expect(context).toEqual(1);

  // 超时后
  jest.runAllTimers();
  expect(f.mock.calls).toHaveLength(2);
  throttled.call(10, 11);
  expect(f.mock.calls).toHaveLength(2);
  jest.runAllTimers();
  expect(f.mock.calls).toHaveLength(3);
  expect(f).toBeCalledWith(11);
  expect(context).toEqual(10);

  // 取消后不再执行
  throttled.cancel();
  throttled.call(12, 13);
  expect(f.mock.calls).toHaveLength(3);
  jest.runAllTimers();
  expect(f.mock.calls).toHaveLength(3);
  jest.useRealTimers();
});

// test('throttle 连续在等待时间内执行', () => {
//   return new Promise(done => {
//     const f = jest.fn();
//     const throttled = throttle(f, 100);
//     let times = 0;

//     const start = () => {
//       if (f.mock.calls.length === 1) {
//         console.log('time:', times);

//         expect(times).toBeGreaterThan(1);

//         jest.useRealTimers();
//         return done(null);
//       }

//       throttled(times++);
//       setTimeout(() => start());
//     };

//     start();
//   });
// }, 2000);

test('once', () => {
  let context: unknown;
  const f = jest.fn(function (a: number, b: number) {
    context = this;
    return a + b;
  });
  const onced = once(f as AnyFunc);

  expect(onced.call(0, 1, 2)).toBe(3);
  expect(f.mock.calls).toHaveLength(1);
  expect(context).toBe(0);
  expect(onced.call(10, 11, 22)).toBe(3);
  expect(f.mock.calls).toHaveLength(1);
  expect(context).toBe(0);
});

test('setGlobal', () => {
  const key = Math.random();
  const val = Math.random();

  const val1 = getGlobal<number>(key);
  expect(val1).toBeUndefined();

  setGlobal(key, val);

  const val2 = getGlobal<number>(key);
  expect(val2).toBe(val);
});
