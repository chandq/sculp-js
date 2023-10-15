import { asyncMap, wait } from '../src/async';

test('wait', () => {
  return new Promise(done => {
    const fn = jest.fn();
    void wait().then(fn);
    expect(fn).not.toBeCalled();
    setTimeout(() => {
      expect(fn).toBeCalled();
      done(null);
    }, 10);
  });
});

test('asyncMap', async () => {
  const startTime = Date.now();
  const list = new Array(3).fill(1).map((n, i) => i);
  const values = await asyncMap(list, async (val, idx) => {
    await wait(100);
    return val * 3;
  });
  const endTime = Date.now();
  // 0, 1, 2 => 0, 3, 6
  expect(values).toEqual([0, 3, 6]);
  expect(endTime - startTime).toBeLessThan(200);
});

test('asyncMap 并发', async () => {
  const fn = jest.fn();
  const list = new Array(10).fill(1).map((n, i) => i);
  await asyncMap(
    list,
    async (val, idx) => {
      console.log(new Date().getMilliseconds(), val, idx);
      fn();
      await wait(10);
      return val * 3;
    },
    2
  );
  expect(fn).toBeCalled();
});
