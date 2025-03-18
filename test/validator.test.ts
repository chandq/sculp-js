import {
  isUrl,
  isEmail,
  isPhone,
  isIpV4,
  isIdNo,
  isInteger,
  isFloat,
  isDigit,
  isNumerical,
  isIpV6
} from '../src/validator';

test('isUrl', () => {
  expect(isUrl('')).toBe(false);
  expect(isUrl('htt1p://aba.com')).toBe(false);
  expect(isUrl('http://aba.monster')).toBe(true);
  expect(isUrl('http://aba.com')).toBe(true);
  expect(isUrl('ftp://aba.com', true)).toBe(true);
  expect(isUrl("http://aba.com:8080/'1@!.+%a?a(x)")).toBe(true);
  expect(isUrl("http://192.168.0.1/'1@!.+%a?a(x)")).toBe(true);
  expect(isUrl("http://192.168.0.1:8080/'1@!.+%a?a(x)")).toBe(true);
});

test('isEmail', () => {
  expect(isEmail('')).toBe(false);
  expect(isEmail('http://aba.com')).toBe(false);
  expect(isEmail('http@aba.com')).toBe(true);
  expect(isEmail('ht.tp@aba.com')).toBe(true);
  expect(isEmail('user.name+tag@example.com')).toBe(true);
});

test('isPhone', () => {
  expect(isPhone('')).toBe(false);
  expect(isPhone('19912345678')).toBe(true);
  expect(isPhone('+8619912345678')).toBe(true);
  expect(isPhone('008619912345678')).toBe(true);
});

test('isIpV4', () => {
  expect(isIpV4('')).toBe(false);
  expect(isIpV4('192.168.1.1')).toBe(true);
  expect(isIpV4('11.11.111.11')).toBe(true);
  expect(isIpV4('222.233.455.11')).toBe(false);
});
test('isIpV6', () => {
  expect(isIpV6('')).toBe(false);
  expect(isIpV6('2001:0db8:85a3::8a2e:0370:7334')).toBe(true);
  expect(isIpV6('11.11.111.11')).toBe(false);
  expect(isIpV6('222.233.455.11')).toBe(false);
});

test('isIdNo', () => {
  // http://id.8684.cn/
  expect(isIdNo('350213197706189461')).toBe(true);
  expect(isIdNo('350213197706189462')).toBe(false);
});

test('isInteger', () => {
  expect(isInteger('1')).toBe(true);
  expect(isInteger('-1')).toBe(true);
  expect(isInteger('12300')).toBe(true);
  expect(isInteger('-12300')).toBe(true);
  expect(isInteger('0')).toBe(true);
  expect(isInteger('0.0')).toBe(false);
  expect(isInteger('0.1')).toBe(false);
  expect(isInteger('-0')).toBe(false);
  expect(isInteger('-0123')).toBe(false);
  expect(isInteger('0123')).toBe(false);
});

test('isFloat', () => {
  expect(isFloat('0')).toBe(false);
  expect(isFloat('0.1')).toBe(true);
  expect(isFloat('1.1')).toBe(true);
  expect(isFloat('1.01')).toBe(true);
  expect(isFloat('10.01')).toBe(true);
  expect(isFloat('-10.01')).toBe(true);
  expect(isFloat('010.01')).toBe(false);
  expect(isFloat('10.010')).toBe(false);
  expect(isFloat('10.0')).toBe(false);
  expect(isFloat('10.')).toBe(false);
  expect(isFloat('10')).toBe(false);
});

test('.isNumrical', () => {
  expect(isNumerical('0')).toBe(true);
  expect(isNumerical('0.0')).toBe(false);
  expect(isNumerical('0.1')).toBe(true);
  expect(isNumerical('1.1')).toBe(true);
  expect(isNumerical('-1.1')).toBe(true);
});

test('isDigit', () => {
  expect(isDigit('1')).toBe(true);
  expect(isDigit('12')).toBe(true);
  expect(isDigit('012')).toBe(true);
  expect(isDigit('+012')).toBe(false);
  expect(isDigit('-012')).toBe(false);
});
