import History from '../src/history';

type Record = () => number;

const makeRecord =
  (n: number): Record =>
  () =>
    n;

test('索引与长度', () => {
  const h = new History<Record>();

  expect(h.index).toBe(-1);
  expect(h.length).toBe(0);

  // -- 1 -->
  //    ^
  h.push(makeRecord(1));

  expect(h.index).toBe(0);
  expect(h.length).toBe(1);

  // -- 1 -- 2 -->
  //         ^
  h.push(makeRecord(2));

  expect(h.index).toBe(1);
  expect(h.length).toBe(2);
});

test('撤销与重做', () => {
  const h = new History<Record>();

  // -- 1 -->
  //    ^
  h.push(makeRecord(1));
  // -- 1 -- 2 -->
  //         ^
  h.push(makeRecord(2));
  // -- 1 -- 2 -- 3 -->
  //              ^
  h.push(makeRecord(3));

  // -- 1 -- 2 -- 3 -->
  //         ^
  const r1 = h.undo();
  expect(r1).not.toBeUndefined();
  if (r1) expect(r1()).toBe(2);

  // -- 1 -- 2 -- 3 -->
  //              ^
  const r2 = h.redo();
  expect(r2).not.toBeUndefined();
  if (r2) expect(r2()).toBe(3);

  // -- 1 -- 2 -- 3 -->
  //         ^
  const r3 = h.undo();
  expect(h.index).toBe(1);
  expect(r3).not.toBeUndefined();
  if (r3) expect(r3()).toBe(2);

  // -- 1 -- 2 -- 3 -->
  //    ^
  const r4 = h.undo();
  expect(h.index).toBe(0);
  expect(r4).not.toBeUndefined();
  if (r4) expect(r4()).toBe(1);

  // -- 1 -- 2 -- 3 -->
  // |  ^
  const r5 = h.undo();
  expect(h.index).toBe(0);
  expect(r5).toBeUndefined();

  // -- 1 -- 2 -- 3 -->
  //         ^
  const r6 = h.redo();
  expect(h.index).toBe(1);
  expect(r6).not.toBeUndefined();
  if (r6) expect(r6()).toBe(2);

  // -- 1 -- 2 -- 3 -->
  //              ^
  const r7 = h.redo();
  expect(h.index).toBe(2);
  expect(r7).not.toBeUndefined();
  if (r7) expect(r7()).toBe(3);

  // -- 1 -- 2 -- 3 -->
  //              ^   |
  const r8 = h.redo();
  expect(h.index).toBe(2);
  expect(r8).toBeUndefined();
});

test('移动', () => {
  // -->
  // ^
  const h = new History<Record>();

  //   -->
  // ^
  expect(h.move(-1)).toBe(undefined);

  // -- 1 -->
  //    ^
  h.push(makeRecord(1));

  // -- 1 -->
  // ^
  const r1 = h.move(-1);
  expect(r1).toBeUndefined();
  expect(h.index).toBe(0);
  expect(h.length).toBe(1);

  // -- 1 -- 2 -->
  //         ^
  h.push(makeRecord(2));
  expect(h.index).toBe(1);

  // -- 1 -- 2 -->
  //    ^
  const r2 = h.move(-1);
  expect(h.index).toBe(0);
  expect(r2).not.toBeUndefined();
  if (r2) expect(r2()).toBe(1);

  // -- 1 -- 2 -->
  // ^
  const r3 = h.move(-1);
  expect(r3).toBeUndefined();

  // -- 1 -- 2 -->
  //         ^
  const r4 = h.toEnd();
  expect(r4).not.toBeUndefined();
  if (r4) expect(r4()).toBe(2);

  // -- 1 -- 2 -->
  //    ^
  const r5 = h.toStart();
  expect(r5).not.toBeUndefined();
  if (r5) expect(r5()).toBe(1);

  // -- 1 -- 2 -->
  //         ^
  const r6 = h.redo();
  expect(r6).not.toBeUndefined();
  if (r6) expect(r6()).toBe(2);

  // -- 1 -- 2 -->
  //    ^
  const r7 = h.undo();
  expect(r7).not.toBeUndefined();
  if (r7) expect(r7()).toBe(1);
});

test('新链', () => {
  // -->
  // ^
  const h = new History<Record>();

  // -- 1 -->
  //    ^
  h.push(makeRecord(1));

  // -- 1 -- 2 -->
  //         ^
  h.push(makeRecord(2));

  // -- 1 -- 2 -- 3 -->
  //              ^
  h.push(makeRecord(3));

  // -- 1 -- 2 -- 3 -->
  //    ^
  h.move(-2);
  expect(h.length).toBe(3);

  // -- 1 -- 2 -- 3 --
  // -- 1 -- 11 -->
  //         ^
  h.push(makeRecord(11));
  expect(h.length).toBe(2);

  // -- 1 -- 2 -- 3 --
  // -- 1 -- 11 -- 111 -->
  //               ^
  h.push(makeRecord(111));
  expect(h.length).toBe(3);

  const r0 = h.get(0);
  const r1 = h.get(1);
  const r2 = h.get(2);

  expect(r0).not.toBeUndefined();
  expect(r0).not.toBeUndefined();
  expect(r2).not.toBeUndefined();

  if (r0) expect(r0()).toBe(1);
  if (r1) expect(r1()).toBe(11);
  if (r2) expect(r2()).toBe(111);

  // -- 1 -- 2 -- 3 --
  // -- 1 -- 11 -- 111 -->
  //         ^
  h.undo();
  expect(h.length).toBe(3);
  expect(h.index).toBe(1);

  // -- 1 -- 2 -- 3 --
  // -- 1 -- 11 -- 111 --
  // -- 1 -- 11 -- 12 -->
  //               ^
  h.push(makeRecord(12));
  expect(h.length).toBe(3);
  expect(h.index).toBe(2);

  const r3 = h.get(0);
  const r4 = h.get(1);
  const r5 = h.get(2);

  expect(r3).not.toBeUndefined();
  expect(r3).not.toBeUndefined();
  expect(r5).not.toBeUndefined();

  if (r3) expect(r3()).toBe(1);
  if (r4) expect(r4()).toBe(11);
  if (r5) expect(r5()).toBe(12);
});

test('最大长度', () => {
  // -->
  // ^
  const h = new History<Record>({ maxLength: 3 });

  h.push(makeRecord(1));
  h.push(makeRecord(2));
  // -- 1 -- 2 -- 3 -->
  //              ^
  h.push(makeRecord(3));
  expect(h.index).toBe(2);
  expect(h.length).toBe(3);

  // -- 2 -- 3 -- 4 -->
  //              ^
  h.push(makeRecord(4));

  expect(h.index).toBe(2);
  expect(h.length).toBe(3);

  const r0 = h.get(0);
  const r1 = h.get(1);
  const r2 = h.get(2);

  expect(r0).not.toBeUndefined();
  expect(r1).not.toBeUndefined();
  expect(r2).not.toBeUndefined();

  if (r0) expect(r0()).toBe(2);
  if (r1) expect(r1()).toBe(3);
  if (r2) expect(r2()).toBe(4);
});
