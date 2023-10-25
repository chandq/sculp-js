import { AnyObject } from '../src/type';
import { uniqueNumber, uniqueString, UNIQUE_NUMBER_SAFE_LENGTH } from '../src/unique';

test('uniqueNumber()', () => {
  const n1 = uniqueNumber();
  const n2 = uniqueNumber();

  // console.log(n1);
  // console.log(n2);
  expect(n1).not.toBe(n2);
  expect(n1.length).toBe(UNIQUE_NUMBER_SAFE_LENGTH);
  expect(n2.length).toBe(UNIQUE_NUMBER_SAFE_LENGTH);
});

test('uniqueNumber() is unique', () => {
  let times = 100000;
  const map: AnyObject = {};
  let found = 0;

  while (times--) {
    const n = uniqueNumber(32);

    if (map[n] === true) {
      console.log('duplicated', n);
      found++;
    }

    map[n] = true;
  }

  expect(found).toBe(0);
});

test('uniqueNumber(length)', () => {
  const n1 = uniqueNumber(11);
  const n2 = uniqueNumber(32);

  // console.log(n1);
  // console.log(n2);
  expect(n1).not.toBe(n2);
  expect(n1.length).toBe(UNIQUE_NUMBER_SAFE_LENGTH);
  expect(n2.length).toBe(32);
});

test('uniqueString()', () => {
  const s1 = uniqueString();
  const s2 = uniqueString();

  // console.log(s1);
  // console.log(s2);
  expect(s1).not.toBe(s2);
});

test('uniqueString() is unique', () => {
  let times = 10000;
  const map: AnyObject = {};
  let found = 0;

  while (times--) {
    const s = uniqueString();

    if (map[s] === true) {
      console.log('duplicated', s);
      found++;
    }

    map[s] = true;
  }

  expect(found).toBe(0);
});

test('uniqueString(length)', () => {
  const s1 = uniqueString(32);
  const s2 = uniqueString(2);
  const s3 = uniqueString();

  // console.log(s1);
  // console.log(s2);
  // console.log(s3);
  expect(s1.length).toBe(32);
  expect(s2.length).toBeGreaterThan(2);
  expect(s3.length).toBeGreaterThan(2);
});

test('uniqueString(pool)', () => {
  const pool = '!@#$%^&*()_+-=[]{};\':",.<>/?\\|';
  const s1 = uniqueString(pool);
  const s2 = uniqueString(pool);

  // console.log(s1);
  // console.log(s2);
  expect(s1).not.toBe(s2);
});

test('uniqueString(length, pool)', () => {
  const pool = '!@#$%^&*()_+-=[]{};\':",.<>/?\\|';
  const s1 = uniqueString(32, pool);
  const s2 = uniqueString(32, pool);

  // console.log(s1);
  // console.log(s2);
  expect(s1).not.toBe(s2);
});
