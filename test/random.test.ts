import { randomNumber, randomString, randomUuid } from '../src/random';

test('randomNumber', () => {
  const n1 = randomNumber(1, 1);
  expect(n1).toBe(1);

  const n2 = randomNumber(11, 33);
  expect(n2).toBeGreaterThanOrEqual(11);
  expect(n2).toBeLessThanOrEqual(33);
});

test('randomString()', () => {
  const s1 = randomString();
  const s2 = randomString();

  // console.log(s1);
  // console.log(s2);
  expect(s1.length).toBe(1);
  expect(s2.length).toBe(1);
});

test('randomString(length)', () => {
  const s1 = randomString(12);
  const s2 = randomString(12);

  // console.log(s1);
  // console.log(s2);
  expect(s1.length).toBe(12);
  expect(s2.length).toBe(12);
});

test('randomString(pool) throw', () => {
  expect(() => {
    randomString('a');
  }).toThrow();
});

test('randomString(pool)', () => {
  const pool = '!@#$%^&*()_+-=[]{};\':",.<>/?\\|';
  const s1 = randomString(pool);
  const s2 = randomString(pool);

  // console.log(s1);
  // console.log(s2);
  expect(s1.length).toBe(1);
  expect(s2.length).toBe(1);
});

test('randomString(length, pool)', () => {
  const pool = '!@#$%^&*()_+-=[]{};\':",.<>/?\\|';
  const s1 = randomString(12, pool);
  const s2 = randomString(12, pool);

  // console.log(s1);
  // console.log(s2);
  expect(s1.length).toBe(12);
  expect(s2.length).toBe(12);
});

test('randomUuid', () => {
  const r = randomUuid();
  // console.log(r);
  expect(r[14]).toEqual('4');
});
