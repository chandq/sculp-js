import { dateParse, formatDate, isValidDate, dateToStart, dateToEnd, adjustDate } from '../src/date';
import dateUtils from '../src/date';
import './utils';

const { calculateDate } = dateUtils;

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
  // 因有时区问题，仅在中国境内执行
  if (Intl.DateTimeFormat().resolvedOptions().timeZone === 'Asia/Shanghai') {
    expect(formatDate(1587953430135)).toBe('2020-04-27 10:10:30');

    expect(formatDate(1604722345684, 'YYYY-MM-DD HH:mm:ss SSS')).toBe('2020-11-07 12:12:25 684');
    // expect(formatDate(1604722345684, 'YYYY-MM-DD HH:mm:ss SS')).toBe('2020-11-07 12:12:25 684');
    // expect(formatDate(1604722345684, 'YYYY-MM-DD HH:mm:ss S')).toBe('2020-11-07 12:12:25 684');
    expect(formatDate(1604722345068, 'YYYY-MM-DD HH:mm:ss SS')).toBe('2020-11-07 12:12:25 68');
    expect(formatDate(1604722345006, 'YYYY-MM-DD HH:mm:ss S')).toBe('2020-11-07 12:12:25 6');
    expect(formatDate(1699771222238, 'YYYY/MM/DD HH:mm:ss ww')).toBe('2023/11/12 14:40:22 周日');
  }

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

test('.calculateDate', () => {
  // 基础日期计算（天）
  expect(adjustDate('2024-01-01', { days: 2 })).toBe('2024-01-03');
  expect(adjustDate('2024-01-01', { days: -2 })).toBe('2023-12-30');
  expect(adjustDate(1717330884896, { days: 2 })).toBe('2024-06-04');
  expect(adjustDate(1717330884896, { days: -2 })).toBe('2024-05-31');

  // 年/月计算
  expect(adjustDate('2024-01-01', { years: 1 })).toBe('2025-01-01');
  expect(adjustDate('2024-01-01', { months: 2 })).toBe('2024-03-01');
  expect(adjustDate('2024-01-01', { years: 1, months: 2, days: 3 })).toBe('2025-03-04');

  // 周计算
  expect(adjustDate('2024-01-01', { weeks: 2 })).toBe('2024-01-15');
  expect(adjustDate('2024-01-01', { weeks: -1 })).toBe('2023-12-25');

  // 时间计算（小时/分钟/秒）
  expect(adjustDate('2024-01-01 10:30:00', { hours: 2 })).toBe('2024-01-01 12:30');
  expect(adjustDate('2024-01-01 10:30:00', { minutes: 30 })).toBe('2024-01-01 11:00');
  expect(adjustDate('2024-01-01 10:30:00', { seconds: 45 })).toBe('2024-01-01 10:30:45');
  expect(adjustDate('2024-01-01 10:30:00', { days: 2, hours: 3, minutes: 30 })).toBe('2024-01-03 14:00');

  // 毫秒计算
  expect(adjustDate('2024-01-01 10:30:00', { milliseconds: 500 })).toBe('2024-01-01 10:30:00.500');
  expect(adjustDate('2024-01-01 10:30:00', { hours: 1, minutes: 30, seconds: 45, milliseconds: 500 })).toBe(
    '2024-01-01 12:00:45.500'
  );

  // 自定义格式
  expect(adjustDate('2024-01-01', { days: 2, format: 'YYYY/MM/DD' })).toBe('2024/01/03');
  expect(adjustDate('2024-01-01', { days: 2, format: 'YYYY 年 MM 月 DD 日' })).toBe('2024 年 01 月 03 日');
  expect(adjustDate('2024-01-01 00:00:00', { days: 2, format: 'YYYY-MM-DD HH:mm:ss' })).toBe('2024-01-03 00:00:00');
  expect(adjustDate('2024-01-01 10:30:00', { days: 2, format: 'YYYY-MM-DD HH:mm' })).toBe('2024-01-03 10:30');

  // 边界测试：月末
  expect(adjustDate('2024-01-31', { days: 1 })).toBe('2024-02-01');
  expect(adjustDate('2024-02-29', { days: 1 })).toBe('2024-03-01');
  expect(adjustDate('2023-02-28', { days: 1 })).toBe('2023-03-01');
  // 月末处理：1 月 31 日 +1 个月应该到 2 月末（date-fns 的行为）
  expect(adjustDate('2024-01-31', { months: 1 })).toBe('2024-02-29');
  expect(adjustDate('2024-01-30', { months: 1 })).toBe('2024-02-29');
  expect(adjustDate('2023-01-31', { months: 1 })).toBe('2023-02-28');
  // 非月末日期正常计算
  expect(adjustDate('2024-01-15', { months: 1 })).toBe('2024-02-15');

  // 边界测试：年末
  expect(adjustDate('2023-12-31', { days: 1 })).toBe('2024-01-01');
  expect(adjustDate('2024-01-01', { days: -1 })).toBe('2023-12-31');

  // Date 对象输入
  expect(adjustDate(new Date('2024-01-01'), { days: 2 })).toBe('2024-01-03');

  // 组合计算
  expect(adjustDate('2024-01-01', { years: 1, months: 1, weeks: 1, days: 1 })).toBe('2025-02-09');

  // 返回 Date 对象
  const result = adjustDate('2024-01-01', { days: 2, returnDate: true });
  expect(result instanceof Date).toBe(true);
  expect((result as Date).getFullYear()).toBe(2024);
  expect((result as Date).getMonth()).toBe(0);
  expect((result as Date).getDate()).toBe(3);
});

// 向后兼容性测试：确保 calculateDate 别名仍然可用
test('.calculateDate (向后兼容)', () => {
  expect(calculateDate('2024-01-01', { days: 2 })).toBe('2024-01-03');
  expect(calculateDate('2024-01-31', { months: 1 })).toBe('2024-02-29');
  expect(calculateDate('2024-01-01', { days: 2, returnDate: true }) instanceof Date).toBe(true);
});
