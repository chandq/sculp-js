import { getGlobal } from './func';
import { STRING_ARABIC_NUMERALS, STRING_LOWERCASE_ALPHA, STRING_UPPERCASE_ALPHA } from './string';

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
export const numberToHex = (decimal: number | string, hexPool: string = HEX_POOL): string => {
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
};

/**
 * 缩写
 * @param {number | string} num
 * @param {Array<string>} units
 * @param {number} ratio
 * @param {number} exponent
 * @returns {string}
 */
export const numberAbbr = (num: number | string, units: Array<string>, ratio = 1000, exponent?: number): string => {
  const { length } = units;
  if (length === 0) throw new Error('至少需要一个单位');

  let num2 = Number(num);
  let times = 0;

  while (num2 >= ratio && times < length - 1) {
    num2 = num2 / ratio;
    times++;
  }

  const value = num2.toFixed(exponent);
  const unit = units[times];
  return value.toString() + '' + unit;
};

/**
 * 将数字格式化成千位分隔符显示的字符串
 * @param {number} val 数字
 * @param {'int' | 'float'} type 展示分段显示的类型 int:整型 | float:浮点型
 * @return {string}
 */
export function formatNumber(val: number, type = 'int'): string {
  return type === 'int' ? parseInt(String(val)).toLocaleString() : Number(val).toLocaleString('en-US');
}
