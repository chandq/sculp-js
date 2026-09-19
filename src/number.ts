import { STRING_ARABIC_NUMERALS, STRING_LOWERCASE_ALPHA, STRING_UPPERCASE_ALPHA } from './string';
import { isNullish } from './type';

export const HEX_POOL = `${STRING_ARABIC_NUMERALS}${STRING_UPPERCASE_ALPHA}${STRING_LOWERCASE_ALPHA}`;

interface JSBI {
  // eslint-disable-next-line @typescript-eslint/ban-types
  BigInt(from: number | string | boolean | object): JSBI;
  // 除
  divide(x: JSBI, y: JSBI): JSBI;
  // 余
  remainder(x: JSBI, y: JSBI): JSBI;
}

const supportBigInt = typeof BigInt !== 'undefined';
// @ts-ignore
const jsbi = () => globalThis.JSBI as JSBI;
const toBigInt = (n: string | number): any => (supportBigInt ? BigInt(n) : jsbi().BigInt(n));
const divide = (x: any, y: any) => (supportBigInt ? x / y : jsbi().divide(x, y));
const remainder = (x: any, y: any) => (supportBigInt ? x % y : jsbi().remainder(x, y));

/**
 * 将十进制转换成任意进制
 * @param {number | string} decimal 十进制数值或字符串，可以是任意长度，会使用大数进行计算
 * @param {string} [hexPool] 进制池，默认 62 进制
 * @returns {string}
 */
export function numberToHex(decimal: number | string, hexPool: string = HEX_POOL): string {
  if (hexPool.length < 2) throw new Error('进制池长度不能少于 2');

  if (!supportBigInt) {
    throw new Error('需要安装 jsbi 模块并将 JSBI 设置为全局变量：\nimport JSBI from "jsbi"; window.JSBI = JSBI;');
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  let bigInt = toBigInt(decimal);
  const ret: Array<string> = [];
  const { length } = hexPool;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const bigLength = toBigInt(length);
  const execute = (): void => {
    const y = Number(remainder(bigInt, bigLength));

    bigInt = divide(bigInt, bigLength);
    ret.unshift(hexPool[y]);

    if (bigInt > 0) {
      execute();
    }
  };

  execute();
  return ret.join('');
}
interface INumberAbbr {
  ratio?: number;
  decimals?: number;
  separator?: string;
}
/**
 * 将数字转换为携带单位的字符串
 * @param {number | string} num
 * @param {Array<string>} units
 * @param {INumberAbbr} options default: { ratio: 1000, decimals: 0, separator: ' ' }
 * @returns {string}
 */
export const numberAbbr = (
  num: number | string,
  units: Array<string>,
  options: INumberAbbr = { ratio: 1000, decimals: 0, separator: ' ' }
): string => {
  const { ratio = 1000, decimals = 0, separator = ' ' } = options;
  const { length } = units;
  if (length === 0) throw new Error('At least one unit is required');

  let num2 = Number(num);
  let times = 0;

  while (num2 >= ratio && times < length - 1) {
    num2 = num2 / ratio;
    times++;
  }

  const value = num2.toFixed(decimals);
  const unit = units[times];
  return String(value) + separator + unit;
};
interface IHumanFileSizeOptions {
  decimals?: number;
  si?: boolean;
  separator?: string;
  baseUnit?: string;
  maxUnit?: string;
}
/**
 * Converting file size in bytes to human-readable string
 *  reference: https://zh.wikipedia.org/wiki/%E5%8D%83%E5%AD%97%E8%8A%82
 * @param {number | string} num bytes Number in Bytes
 * @param {IHumanFileSizeOptions} options default: { decimals = 0, si = false, separator = ' ' }
 *        si: True to use metric (SI) units, aka powers of 1000, units is
 *            ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'].
 *            False to use binary (IEC), aka powers of 1024, units is
 *            ['Byte', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
 * @returns
 */
export function humanFileSize(
  num: number | string,
  options: IHumanFileSizeOptions = { decimals: 0, si: false, separator: ' ' }
): string {
  const { decimals = 0, si = false, separator = ' ', baseUnit, maxUnit } = options;
  let units = si
    ? ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['Byte', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  if (!isNullish(baseUnit)) {
    const targetIndex = units.findIndex(el => el === baseUnit);
    if (targetIndex !== -1) {
      units = units.slice(targetIndex);
    }
  }
  if (!isNullish(maxUnit)) {
    const targetIndex = units.findIndex(el => el === maxUnit);
    if (targetIndex !== -1) {
      units.splice(targetIndex + 1);
    }
  }
  return numberAbbr(num, units, { ratio: si ? 1000 : 1024, decimals, separator });
}

/**
 * 将数字格式化成千位分隔符显示的字符串
 * @param {number|string} num 数字
 * @param {number} decimals 格式化成指定小数位精度的参数
 * @returns {string}
 */
function expandExponential(value: string): string {
  const match = /^([+-]?)(\d+)(?:\.(\d*))?[eE]([+-]?\d+)$/.exec(value);
  if (!match) return value;

  const [, sign, integer, fraction = '', exponentString] = match;
  const digits = integer + fraction;
  const decimalIndex = integer.length + Number(exponentString);

  if (decimalIndex <= 0) {
    return `${sign}0.${'0'.repeat(-decimalIndex)}${digits}`;
  }
  if (decimalIndex >= digits.length) {
    return `${sign}${digits}${'0'.repeat(decimalIndex - digits.length)}`;
  }
  return `${sign}${digits.slice(0, decimalIndex)}.${digits.slice(decimalIndex)}`;
}

function addThousandsSeparators(value: number): string {
  if (Number.isNaN(value)) return 'NaN';
  if (value === Infinity) return '∞';
  if (value === -Infinity) return '-∞';
  if (Object.is(value, -0)) return '-0';

  const plainValue = expandExponential(String(value));
  const negative = plainValue.startsWith('-');
  const unsignedValue = negative ? plainValue.slice(1) : plainValue;
  const [integer, fraction] = unsignedValue.split('.');
  const groupedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return `${negative ? '-' : ''}${groupedInteger}${fraction === undefined ? '' : `.${fraction}`}`;
}

/**
 * `Number#toLocaleString('en-US')` 默认最多保留 3 位小数。这里保留原函数的该行为，
 * 同时避免依赖小程序环境中可能缺失或实现不一致的 Intl。
 */
function roundToLocalePrecision(value: number): number {
  if (!Number.isFinite(value) || Math.abs(value) >= 1e21) return value;

  const plainValue = expandExponential(String(value));
  const negative = plainValue.startsWith('-');
  const unsignedValue = negative ? plainValue.slice(1) : plainValue;
  const [integer, fraction = ''] = unsignedValue.split('.');
  if (fraction.length <= 3) return value;

  const retainedFraction = fraction.slice(0, 3);
  let retainedDigits = `${integer}${retainedFraction}`;
  if (fraction.charCodeAt(3) >= 53) {
    let index = retainedDigits.length - 1;
    while (index >= 0 && retainedDigits[index] === '9') {
      retainedDigits = `${retainedDigits.slice(0, index)}0${retainedDigits.slice(index + 1)}`;
      index--;
    }
    retainedDigits =
      index < 0
        ? `1${retainedDigits}`
        : `${retainedDigits.slice(0, index)}${Number(retainedDigits[index]) + 1}${retainedDigits.slice(index + 1)}`;
  }

  const decimalIndex = retainedDigits.length - 3;
  const rounded = `${negative ? '-' : ''}${retainedDigits.slice(0, decimalIndex)}.${retainedDigits.slice(
    decimalIndex
  )}`;
  return Number(rounded);
}

export function formatNumber(num: number | string, decimals?: number): string {
  if (isNullish(decimals)) {
    return addThousandsSeparators(parseInt(String(num)));
  }
  let prec = 0;
  if (decimals > 0) {
    prec = decimals;
  }
  const roundedValue = Number(Number(num).toFixed(prec));
  return addThousandsSeparators(roundToLocalePrecision(roundedValue));
}
export { formatNumber as formatMoney };

export default {
  HEX_POOL,
  numberToHex,
  numberAbbr,
  humanFileSize,
  formatNumber,
  formatMoney: formatNumber
};
