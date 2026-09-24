import { numberToHex, numberAbbr, formatNumber, humanFileSize } from '../src/number';
import './utils';

test('numberToHex', () => {
  const n1 = '12345678901234567890';
  const n2 = 'EhzL6HwZ5ow';

  expect(numberToHex(n1)).toBe(n2);

  const n5 = 1234567890;

  expect(numberToHex(n5, '0123456789ABCDEF')).toBe(n5.toString(16).toUpperCase());
});

test('numberToHex(pool) throw', () => {
  const n1 = '12345678901234567890';

  expect(() => {
    numberToHex(n1, 'a');
  }).toThrow();
});

describe('numberAbbr fileSize', () => {
  const fileSymbols = ['B', 'KB', 'MB', 'GB', 'TB'];

  test('B', () => {
    const value = numberAbbr(1, fileSymbols, { ratio: 1024, separator: '' });
    expect(value).toEqual('1B');
  });

  test('KB', () => {
    const value = numberAbbr('1024', fileSymbols, { ratio: 1024, separator: '' });
    expect(value).toEqual('1KB');
  });

  test('MB', () => {
    const value = numberAbbr(1024 * 1024, fileSymbols, { ratio: 1024, separator: '' });
    expect(value).toEqual('1MB');
  });

  test('GB', () => {
    const value = numberAbbr(3 * 1024 * 1024 * 1024, fileSymbols, { ratio: 1024, separator: '' });
    expect(value).toEqual('3GB');
  });

  test('TB', () => {
    const value = numberAbbr(3 * 1024 * 1024 * 1024 * 1024, fileSymbols, { ratio: 1024, separator: '' });
    expect(value).toEqual('3TB');
  });

  test('more TB', () => {
    const value = numberAbbr(3 * 1024 * 1024 * 1024 * 1024 * 1024, fileSymbols, { ratio: 1024, separator: '' });
    expect(value).toEqual('3072TB');
  });
});

describe('humanFileSize', () => {
  test('B', () => {
    const value = humanFileSize(1, { si: true });
    const value2 = humanFileSize(1, { si: false });
    expect(value).toEqual('1 B');
    expect(value2).toEqual('1 Byte');
  });

  test('KB', () => {
    const value = humanFileSize(1024, { si: true });
    const value2 = humanFileSize(1024, { si: false });
    const value3 = humanFileSize(1024, { si: true, decimals: 2 });
    const value4 = humanFileSize(1024, { si: false, decimals: 2 });
    const value5 = humanFileSize(1024, { si: false, decimals: 2, separator: '' });
    expect(value).toEqual('1 kB');
    expect(value2).toEqual('1 KiB');
    expect(value3).toEqual('1.02 kB');
    expect(value4).toEqual('1.00 KiB');
    expect(value5).toEqual('1.00KiB');
  });

  test('MB', () => {
    const value = humanFileSize(1024 * 1024, { si: true });
    const value2 = humanFileSize(1024 * 1024, { si: false });
    const value3 = humanFileSize(1024 * 1024, { baseUnit: 'KiB', si: false });
    const value4 = humanFileSize(1024 * 1024);
    const value5 = humanFileSize(1024 * 1024, { baseUnit: 'nb' }); // invalid baseUnit arg
    expect(value).toEqual('1 MB');
    expect(value2).toEqual('1 MiB');
    expect(value3).toEqual('1 GiB');
    expect(value4).toEqual('1 MiB');
    expect(value5).toEqual('1 MiB');
  });

  test('GB', () => {
    const value = humanFileSize(5 * Math.pow(1024, 3), { si: true });
    const value2 = humanFileSize(5 * Math.pow(1024, 3), { si: false });
    expect(value).toEqual('5 GB');
    expect(value2).toEqual('5 GiB');
  });

  test('TB', () => {
    const value = humanFileSize(5 * Math.pow(1024, 4), { si: true });
    const value2 = humanFileSize(5 * Math.pow(1024, 4), { si: false });
    expect(value).toEqual('5 TB');
    expect(value2).toEqual('5 TiB');
  });

  test('more TB', () => {
    const value = humanFileSize(5 * Math.pow(1024, 5), { si: true, decimals: 2, maxUnit: 'TB' });
    const value2 = humanFileSize(5 * Math.pow(1024, 5), { si: false, decimals: 2, maxUnit: 'TiB' });
    expect(value).toEqual('5629.50 TB');
    expect(value2).toEqual('5120.00 TiB');
  });
  test('PB', () => {
    const value = humanFileSize(5 * Math.pow(1024, 5), { si: true, decimals: 2 });
    const value2 = humanFileSize(5 * Math.pow(1024, 5), { si: false, decimals: 2 });
    expect(value).toEqual('5.63 PB');
    expect(value2).toEqual('5.00 PiB');
  });
});

describe('numberAbbr meter', () => {
  const meterSymbols = ['米', '千米'];

  test('米', () => {
    const value = numberAbbr(0.123456789, meterSymbols, { ratio: 1000, decimals: 2, separator: '' });
    expect(value).toEqual('0.12米');
  });

  test('米2', () => {
    const value = numberAbbr(12.123456789, meterSymbols, { ratio: 1000, decimals: 2, separator: '' });
    expect(value).toEqual('12.12米');
  });

  test('千米', () => {
    const value = numberAbbr(1234.123456789, meterSymbols, { ratio: 1000, decimals: 2, separator: '' });
    expect(value).toEqual('1.23千米');
  });

  test('千米2', () => {
    const value = numberAbbr(12345678.123456789, meterSymbols, { ratio: 1000, separator: '' });
    expect(value).toEqual('12346千米');
  });
});

test('numberAbbr 无单位', () => {
  expect(() => {
    numberAbbr(1, []);
  }).toThrow('At least one unit is required');
});
test('formatNumber 格式化', () => {
  const money = 123456789,
    floatMoney = 123456.789,
    decimalMoney = -2330.123456;
  expect(formatNumber(money)).toBe('123,456,789');
  expect(formatNumber(decimalMoney)).toBe('-2,330');
  expect(formatNumber(decimalMoney, 5)).toBe('-2,330.12346');
  // When decimals is explicitly set it is always honoured – trailing zeroes never silently dropped.
  expect(formatNumber(money, 2)).toBe('123,456,789.00');
  expect(formatNumber(floatMoney, 2)).toBe('123,456.79');
  expect(formatNumber(floatMoney, -1)).toBe('123,457');
  expect(formatNumber(-123456.789, 2)).toBe('-123,456.79');
  // Large number with forced 2 decimals shows .00
  expect(formatNumber(1e21, 2)).toBe('1,000,000,000,000,000,000,000.00');
  // No longer capped at 3 fraction digits when decimals is specified
  expect(formatNumber(1.23456789, 4)).toBe('1.2346');
  // Small number with padding
  expect(formatNumber(1e-7, 8)).toBe('0.00000010');
  expect(formatNumber(decimalMoney, 4)).toBe('-2,330.1235');
  expect(formatNumber('-0')).toBe('-0'); // preserves negative zero sign
  expect(formatNumber('-0', 2)).toBe('-0.00'); // forced precision keeps the -0 sign
  expect(formatNumber(-0, 2)).toBe('-0.00');
  expect(formatNumber('invalid')).toBe('NaN');
  expect(formatNumber('invalid', 2)).toBe('NaN');
  // 非有限值永远不带小数部分（NaN/Infinity 不是十进制数量）
  expect(formatNumber(NaN, 2)).toBe('NaN');
  expect(formatNumber(Infinity, 2)).toBe('∞');
  expect(formatNumber(-Infinity, 2)).toBe('-∞');
  expect(formatNumber(Infinity)).toBe('∞');
});

test('formatNumber trimZeros 动态小数位', () => {
  // 整数不再强制补 '.00'
  expect(formatNumber(1000, 2, true)).toBe('1,000');
  expect(formatNumber(0, 2, true)).toBe('0');
  expect(formatNumber(-0, 2, true)).toBe('-0');
  expect(formatNumber(-1000, 2, true)).toBe('-1,000');
  // 有效小数仍然保留，仅去掉多余的尾随零
  expect(formatNumber(1000.5, 2, true)).toBe('1,000.5');
  expect(formatNumber(1000.05, 2, true)).toBe('1,000.05');
  expect(formatNumber(1.1, 3, true)).toBe('1.1');
  expect(formatNumber(3.14159, 4, true)).toBe('3.1416');
  // 四舍五入后小数部分消失时，小数点一并移除
  expect(formatNumber(0.001, 2, true)).toBe('0');
  // 大数、特殊值
  expect(formatNumber(1e21, 2, true)).toBe('1,000,000,000,000,000,000,000');
  expect(formatNumber(NaN, 2, true)).toBe('NaN');
  expect(formatNumber(Infinity, 2, true)).toBe('∞');
  // 默认值保持强制精度（向后兼容）
  expect(formatNumber(1000, 2)).toBe('1,000.00');
  expect(formatNumber(1000, 2, false)).toBe('1,000.00');
});

test('formatNumber 不依赖 toLocaleString', () => {
  const toLocaleString = jest.spyOn(Number.prototype, 'toLocaleString').mockImplementation(() => {
    throw new Error('not supported');
  });

  try {
    expect(formatNumber(1234567.89, 2)).toBe('1,234,567.89');
  } finally {
    toLocaleString.mockRestore();
  }
});
