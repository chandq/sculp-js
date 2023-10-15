import { formatDate } from '../src/date';



test('.formatDate', () => {
  expect(formatDate(new Date('2020-01-01 00:00:00'), 'YYYY-M-D')).toBe('2020-1-1');
  expect(formatDate(new Date('2020-01-01 00:00:00'), 'yyyy-M-d')).toBe('2020-1-1');
  expect(formatDate(new Date('2020-12-12 00:00:00'), 'YYYY-M-D')).toBe('2020-12-12');
  expect(formatDate(new Date('2020-01-01 00:00:00'))).toBe('2020-01-01 00:00:00');
  expect(formatDate(new Date(1587953430135))).toBe('2020-04-27 10:10:30');

  expect(formatDate(new Date(1604722345684), 'YYYY-MM-DD HH:mm:ss SSS')).toBe('2020-11-07 12:12:25 684');
  expect(formatDate(new Date(1604722345684), 'YYYY-MM-DD HH:mm:ss SS')).toBe('2020-11-07 12:12:25 684');
  expect(formatDate(new Date(1604722345684), 'YYYY-MM-DD HH:mm:ss S')).toBe('2020-11-07 12:12:25 684');
  expect(formatDate(new Date(1604722345068), 'YYYY-MM-DD HH:mm:ss SS')).toBe('2020-11-07 12:12:25 68');
  expect(formatDate(new Date(1604722345006), 'YYYY-MM-DD HH:mm:ss S')).toBe('2020-11-07 12:12:25 6');
  expect(formatDate(new Date(1697367617490), 'YYYY/MM/DD HH:mm:ss ww')).toBe('2023/10/15 19:00:17 周日');

  expect(formatDate(new Date('2020-01-01 00:00:00'), 'YYYY-M-D')).toBe('2020-1-1');
});

