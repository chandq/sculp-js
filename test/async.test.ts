import { asyncMap, safeAwait, wait } from '../src/async';

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
      // console.log(new Date().getMilliseconds(), val, idx);
      fn();
      await wait(10);
      return val * 3;
    },
    2
  );
  expect(fn).toBeCalled();
});

describe('Await safeAwait test', () => {
  test('should return a value when resolved', async () => {
    const testInput = 41;
    const promise = Promise.resolve(testInput);

    const [err, data] = await safeAwait<number>(promise);

    expect(err).toBeNull();
    expect(data).toEqual(testInput);
  });

  test('should return an error when promise is rejected', async () => {
    const testInput = 41;
    const promise = Promise.reject('Error');

    const [err, data] = await safeAwait<number>(promise);

    expect(err).toEqual('Error');
    expect(data).toBeUndefined();
  });

  test('should add external properties safeAwait the error object', async () => {
    const promise = Promise.reject({ error: 'Error message' });

    const [err] = await safeAwait<string, { error: string; extraKey: number }>(promise, {
      extraKey: 1
    });

    expect(err).toBeTruthy();
    expect((err as any).extraKey).toEqual(1);
    expect((err as any).error).toEqual('Error message');
  });

  test('should receive the type of the parent if no type was passed', async () => {
    let user: { name: string };
    let err: Error;
    // @ts-ignore
    [err, user] = await safeAwait(Promise.resolve({ name: '123' }));// eslint-disable-line

    expect(user.name).toEqual('123');
  });
});
