import { dateParse, formatDate, isValidDate, dateToStart, dateToEnd } from '../src/date';

test('.isValidDate', () => {
  expect(isValidDate(new Date())).toBe(true);
  expect(isValidDate(new Date('xxx'))).toBe(false);
  expect(isValidDate(null)).toBe(false);
});

test('.dateParse', () => {
  expect(isValidDate(dateParse('2020-04-27 10:00:00'))).toBe(true);
  expect(isValidDate(dateParse('2020-06-19T17:47:53.000+0800'))).toBe(true);
  expect(dateParse(1587953430135).getFullYear()).toBe(2020);
  const d1 = new Date('2020-04-27 10:00:00');
  const d2 = dateParse(d1);
  expect(d1.getFullYear()).toBe(d2.getFullYear());
  expect(d1).not.toBe(d2);
  expect(() => dateParse('x')).toThrow('不是一个合法的日期描述');
});

test('.formatDate', () => {
  expect(formatDate('2020-01-01 00:00:00', 'YYYY-M-D')).toBe('2020-1-1');
  expect(formatDate('2020-01-01 00:00:00', 'yyyy-M-d')).toBe('2020-1-1');
  expect(formatDate('2020-12-12 00:00:00', 'YYYY-M-D')).toBe('2020-12-12');
  expect(formatDate('2020-01-01 00:00:00')).toBe('2020-01-01 00:00:00');
  // expect(formatDate(1587953430135)).toBe('2020-04-27 10:10:30');

  // expect(formatDate(1604722345684, 'YYYY-MM-DD HH:mm:ss SSS')).toBe('2020-11-07 12:12:25 684');
  // expect(formatDate(1604722345684, 'YYYY-MM-DD HH:mm:ss SS')).toBe('2020-11-07 12:12:25 684');
  // expect(formatDate(1604722345684, 'YYYY-MM-DD HH:mm:ss S')).toBe('2020-11-07 12:12:25 684');
  // expect(formatDate(1604722345068, 'YYYY-MM-DD HH:mm:ss SS')).toBe('2020-11-07 12:12:25 68');
  // expect(formatDate(1604722345006, 'YYYY-MM-DD HH:mm:ss S')).toBe('2020-11-07 12:12:25 6');
  // expect(formatDate(1699771222238, 'YYYY/MM/DD HH:mm:ss ww')).toBe('2023/11/12 14:40:22 周日');

  expect(formatDate(new Date('2020-01-01 00:00:00'), 'YYYY-M-D')).toBe('2020-1-1');
});

test('.dateToStart', () => {
  const d1 = new Date();
  const d2 = dateToStart(d1);

  expect(d2.getFullYear()).toBe(d1.getFullYear());
  expect(d2.getMonth()).toBe(d1.getMonth());
  expect(d2.getDate()).toBe(d1.getDate());
  expect(d2.getHours()).toBe(0);
  expect(d2.getMinutes()).toBe(0);
  expect(d2.getSeconds()).toBe(0);
  expect(d2.getMilliseconds()).toBe(0);
});

test('.dateToEnd', () => {
  const d1 = new Date();
  const d2 = dateToEnd(d1);

  expect(d2.getFullYear()).toBe(d1.getFullYear());
  expect(d2.getMonth()).toBe(d1.getMonth());
  expect(d2.getDate()).toBe(d1.getDate());
  expect(d2.getHours()).toBe(23);
  expect(d2.getMinutes()).toBe(59);
  expect(d2.getSeconds()).toBe(59);
  expect(d2.getMilliseconds()).toBe(999);
});
