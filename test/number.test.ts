import { numberToHex, numberAbbr } from '../src/number';

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
    const value = numberAbbr(1, fileSymbols, 1024);
    expect(value).toEqual('1B');
  });

  test('KB', () => {
    const value = numberAbbr('1024', fileSymbols, 1024);
    expect(value).toEqual('1KB');
  });

  test('MB', () => {
    const value = numberAbbr(1024 * 1024, fileSymbols, 1024);
    expect(value).toEqual('1MB');
  });

  test('GB', () => {
    const value = numberAbbr(3 * 1024 * 1024 * 1024, fileSymbols, 1024);
    expect(value).toEqual('3GB');
  });

  test('TB', () => {
    const value = numberAbbr(3 * 1024 * 1024 * 1024 * 1024, fileSymbols, 1024);
    expect(value).toEqual('3TB');
  });

  test('more TB', () => {
    const value = numberAbbr(3 * 1024 * 1024 * 1024 * 1024 * 1024, fileSymbols, 1024);
    expect(value).toEqual('3072TB');
  });
});

describe('numberAbbr meter', () => {
  const meterSymbols = [' 米', ' 千米'];

  test('米', () => {
    const value = numberAbbr(0.123456789, meterSymbols, 1000, 2);
    expect(value).toEqual('0.12 米');
  });

  test('米2', () => {
    const value = numberAbbr(12.123456789, meterSymbols, 1000, 2);
    expect(value).toEqual('12.12 米');
  });

  test('千米', () => {
    const value = numberAbbr(1234.123456789, meterSymbols, 1000, 2);
    expect(value).toEqual('1.23 千米');
  });

  test('千米2', () => {
    const value = numberAbbr(12345678.123456789, meterSymbols, 1000);
    expect(value).toEqual('12346 千米');
  });
});

test('numberAbbr 无单位', () => {
  expect(() => {
    numberAbbr(1, []);
  }).toThrow('单位');
});
