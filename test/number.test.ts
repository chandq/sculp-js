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
    floatMoney = 123456.789;
  expect(formatNumber(money)).toBe('123,456,789');
  expect(formatNumber(floatMoney, 2)).toBe('123,456.79');
  expect(formatNumber(floatMoney, -1)).toBe('123,457');
});
