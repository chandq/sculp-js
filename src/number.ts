import { arrayEach } from './array';
import { getGlobal } from './func';
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
const jsbi = () => getGlobal<JSBI>('JSBI') as JSBI;
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
  precision?: number;
  separator?: string;
}
/**
 * 将数字转换为携带单位的字符串
 * @param {number | string} num
 * @param {Array<string>} units
 * @param {INumberAbbr} options default: { ratio: 1000, precision: 0, separator: ' ' }
 * @returns {string}
 */
export const numberAbbr = (
  num: number | string,
  units: Array<string>,
  options: INumberAbbr = { ratio: 1000, precision: 0, separator: ' ' }
): string => {
  const { ratio = 1000, precision = 0, separator = ' ' } = options;
  const { length } = units;
  if (length === 0) throw new Error('At least one unit is required');

  let num2 = Number(num);
  let times = 0;

  while (num2 >= ratio && times < length - 1) {
    num2 = num2 / ratio;
    times++;
  }

  const value = num2.toFixed(precision);
  const unit = units[times];
  return String(value) + separator + unit;
};
interface IHumanFileSizeOptions {
  precision?: number;
  si?: boolean;
  separator?: string;
  maxUnit?: string;
}
/**
 * Converting file size in bytes to human-readable string
 *  reference: https://zh.wikipedia.org/wiki/%E5%8D%83%E5%AD%97%E8%8A%82
 * @param {number | string} num bytes Number in Bytes
 * @param {IHumanFileSizeOptions} options default: { precision = 0, si = false, separator = ' ' }
 *        si: True to use metric (SI) units, aka powers of 1000, the units is
 *            ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'].
 *            False to use binary (IEC), aka powers of 1024, the units is
 *            ['Byte', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
 * @returns
 */
export function humanFileSize(num: number | string, options: IHumanFileSizeOptions): string {
  const { precision = 0, si = false, separator = ' ', maxUnit } = options;
  const units = si
    ? ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['Byte', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  if (!isNullish(maxUnit)) {
    const targetIndex = units.findIndex(el => el === maxUnit);
    if (targetIndex !== -1) {
      units.splice(targetIndex + 1);
    }
  }
  return numberAbbr(num, units, { ratio: si ? 1000 : 1024, precision, separator });
}

/**
 * 将数字格式化成千位分隔符显示的字符串
 * @param {number} val 数字
 * @param {'int' | 'float'} type 展示分段显示的类型 int:整型 | float:浮点型
 * @returns {string}
 */
export function formatNumber(val: number, type = 'int'): string {
  return type === 'int' ? parseInt(String(val)).toLocaleString() : Number(val).toLocaleString('en-US');
}
