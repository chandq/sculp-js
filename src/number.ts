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
const SI_FILE_SIZE_UNITS = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] as const;
const IEC_FILE_SIZE_UNITS = ['Byte', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'] as const;

/** Byte-based file size units. KB is an alias for the SI unit kB. */
export type FileSizeUnit = (typeof SI_FILE_SIZE_UNITS)[number] | (typeof IEC_FILE_SIZE_UNITS)[number] | 'KB';

function resolveFileSizeUnit(unit: FileSizeUnit): { unit: FileSizeUnit; bytes: number } {
  const normalized = unit === 'KB' ? 'kB' : unit;
  const siIndex = SI_FILE_SIZE_UNITS.findIndex(value => value === normalized);
  if (siIndex !== -1) return { unit: normalized, bytes: 1000 ** siIndex };
  const iecIndex = IEC_FILE_SIZE_UNITS.findIndex(value => value === normalized);
  if (iecIndex !== -1) return { unit: normalized, bytes: 1024 ** iecIndex };
  throw new RangeError(`Invalid file size unit: ${String(unit)}`);
}

// maxDisplayUnit only constrains the active output scale, so resolve it inside
// that scale instead of treating it as a scale-independent unit like fromUnit/toUnit.
// B and Byte are synonymous byte units; KB is the documented alias of kB.
function resolveOutputScaleIndex(unit: FileSizeUnit, units: readonly FileSizeUnit[]): number {
  const normalized: FileSizeUnit = unit === 'KB' ? 'kB' : unit === 'B' || unit === 'Byte' ? units[0] : unit;
  const index = units.findIndex(value => value === normalized);
  if (index === -1) {
    throw new RangeError(`maxDisplayUnit must be a unit in the selected output scale, received: ${String(unit)}`);
  }
  return index;
}

interface IHumanFileSizeOptions {
  decimals?: number;
  si?: boolean;
  separator?: string;
  /**
   * Ceiling for automatic unit escalation. As the formatter walks up the unit
   * scale (Byte -> KiB -> MiB -> ...), it never selects a unit larger than this;
   * an oversized value is rendered with a larger number in the ceiling unit,
   * e.g. 5*1024^5 bytes capped at TiB renders as '5120.00 TiB'. Units below the
   * ceiling are still chosen automatically, so this is not a fixed output unit
   * (use toUnit for that). Must belong to the si-selected output scale;
   * 'B'/'Byte' are synonymous byte caps and 'KB' is accepted as the SI alias of
   * 'kB'. Ignored when toUnit is set.
   */
  maxDisplayUnit?: FileSizeUnit;
  /** Source unit of the input value. Unit names determine their own SI/IEC scale. */
  fromUnit?: FileSizeUnit;
  /** Fixed output unit; overrides si and maxDisplayUnit for output selection. */
  toUnit?: FileSizeUnit;
}
/**
 * Formats a file size, optionally converting between source and target units.
 * SI units (kB through YB) use powers of 1000; IEC units (KiB through YiB)
 * use powers of 1024. B and Byte both mean bytes; KB is rendered as kB.
 *
 *  reference: https://zh.wikipedia.org/wiki/%E5%8D%83%E5%AD%97%E8%8A%82
 *
 *  si: True to use metric (SI) units, aka powers of 1000, units is
 *      ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'].
 *      False to use binary (IEC), aka powers of 1024, units is
 *      ['Byte', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
 *
 * Without fromUnit or toUnit, num is treated as bytes and the unit is selected
 * automatically by scaling upward only. fromUnit declares the unit of num, in
 * which case automatic conversion may also scale down; the unit name selects
 * its own SI/IEC scale. toUnit fixes the output unit regardless of si or
 * maxDisplayUnit. Without toUnit, si selects the output scale (false: IEC,
 * true: SI), and maxDisplayUnit caps automatic unit escalation. It must belong
 * to that output scale (B/Byte are synonymous byte caps, and KB is accepted as
 * the SI alias of kB); it is ignored when toUnit is set.
 * Automatic conversion selects units by absolute value, preserving the sign.
 *
 * @param num Size as a number or numeric string, in bytes unless fromUnit is specified.
 * Uses JavaScript number precision; strings containing units are not parsed.
 * @param options Defaults: decimals = 0, si = false, separator = ' '.
 * Rounding is applied only after conversion.
 * @returns The formatted value followed by the separator and unit.
 * @throws {RangeError} If a supplied fromUnit, toUnit or maxDisplayUnit is
 * invalid, or maxDisplayUnit is not a unit of the selected output scale.
 * @example
 * ```ts
 * humanFileSize(1.5, { fromUnit: 'GiB', toUnit: 'MiB' }); // '1536 MiB'
 * humanFileSize(1, { fromUnit: 'MB', toUnit: 'KiB', decimals: 2 }); // '976.56 KiB'
 * humanFileSize(0.5, { fromUnit: 'MiB' }); // '512 KiB'
 * humanFileSize(1536, { toUnit: 'KiB', decimals: 2 }); // '1.50 KiB'
 * humanFileSize(5 * 1024 ** 5, { maxDisplayUnit: 'TiB', decimals: 2 }); // '5120.00 TiB'
 * ```
 */
export function humanFileSize(
  num: number | string,
  options: IHumanFileSizeOptions = { decimals: 0, si: false, separator: ' ' }
): string {
  const { decimals = 0, si = false, separator = ' ', maxDisplayUnit, fromUnit, toUnit } = options;
  const units: FileSizeUnit[] = [...(si ? SI_FILE_SIZE_UNITS : IEC_FILE_SIZE_UNITS)];
  const ratio = si ? 1000 : 1024;

  if (fromUnit !== undefined || toUnit !== undefined) {
    // Without an explicit source unit, the value is read in the scale's base unit (bytes).
    // Keep an explicit undefined check: null must still reach validation and throw.
    const source = resolveFileSizeUnit(fromUnit === undefined ? units[0] : fromUnit);
    const value = Number(num);
    if (toUnit !== undefined) {
      const target = resolveFileSizeUnit(toUnit);
      return (value * (source.bytes / target.bytes)).toFixed(decimals) + separator + target.unit;
    }

    const limit = maxDisplayUnit === undefined ? units.length - 1 : resolveOutputScaleIndex(maxDisplayUnit, units);
    let index = 0;
    // Compare in each candidate unit to avoid overflowing an intermediate byte value.
    while (index < limit && Math.abs(value * (source.bytes / ratio ** (index + 1))) >= 1) {
      index++;
    }
    return (value * (source.bytes / ratio ** index)).toFixed(decimals) + separator + units[index];
  }

  // Plain byte formatting: scale upward only, with maxDisplayUnit capping the available units.
  if (maxDisplayUnit !== undefined) {
    units.splice(resolveOutputScaleIndex(maxDisplayUnit, units) + 1);
  }
  return numberAbbr(num, units, { ratio, decimals, separator });
}

/**
 * Expands a numeric string written in exponential notation (e.g. `1.5e-7` or
 * `2e+21`) into its plain decimal form, so that thousands separators can be
 * applied without accidentally reformatting the exponent. Strings that are
 * not in exponential form are returned unchanged.
 * @param {string} value the string representation of a number
 * @returns {string} the expanded plain decimal string
 * @example
 * ```ts
 * expandExponential('1.5e+3'); // => '1500'
 * expandExponential('1e-7'); // => '0.0000001'
 * expandExponential('1234.5'); // => '1234.5' (unchanged)
 * ```
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

/**
 * Converts a number to a decimal string with comma thousands separators
 * applied to the integer part, keeping the fraction digits unchanged.
 * Special values are rendered as `NaN`, `∞` or `-∞`, and negative zero
 * preserves its sign. A string is accepted so that callers which already hold
 * an intermediate `toFixed` result (which may itself be in exponential form,
 * e.g. `'1e+21'`) can group it without a lossy `Number()` round-trip.
 * @param {number | string} value the number, or its string form, to format
 * @returns {string} the grouped decimal string
 * @example
 * ```ts
 * addThousandsSeparators(1234567.891); // => '1,234,567.891'
 * addThousandsSeparators('1e+21'); // => '1,000,000,000,000,000,000,000'
 * addThousandsSeparators(NaN); // => 'NaN'
 * addThousandsSeparators(-0); // => '-0'
 * ```
 */
function addThousandsSeparators(value: number | string): string {
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
 * Pads a decimal-fraction string to a fixed width so that the result always
 * has exactly the requested number of fractional digits, even when they are
 * all zeroes (producing `'.00'` for two decimals).
 * @param {string} fraction the raw fraction substring from `toFixed`
 * @param {number} target   how many fractional digits the final string must have
 * @returns {string} the zero-padded fraction (without preceding '.')
 */
function padFraction(fraction: string, target: number): string {
  while (fraction.length < target) fraction += '0';
  return fraction;
}

/**
 * Strips trailing zeroes from a fraction string, returning an empty string
 * when nothing significant remains (so that the caller can drop the
 * decimal point entirely).
 * @param {string} fraction the fraction substring produced by `toFixed`
 * @returns {string} the fraction without trailing zeroes
 */
function trimTrailingZeroes(fraction: string): string {
  return fraction.replace(/0+$/, '');
}

/**
 * Formats a number into a string with comma thousands separators.
 *
 * When `decimals` is omitted, the input is truncated to an integer (like
 * `parseInt`) and grouped. When `decimals` is provided, the value is rounded
 * to that many fraction digits. By default the requested precision is always
 * emitted – `formatMoney(1000, 2)` yields `'1,000.00'` – which keeps
 * monetary and tabular columns aligned, matching `Number#toFixed` and the
 * `minimumFractionDigits` behavior of `Intl.NumberFormat`.
 *
 * Pass `trimZeros` to opt into dynamic precision instead: trailing zeroes are
 * removed and the decimal point is dropped when no fraction remains, so the
 * output reflects whether the original value actually carried a fraction
 * (analogous to `Intl`'s `maximumFractionDigits`-only behavior).
 *
 * Non-finite values are always rendered symbolically as `NaN`, `∞` or `-∞`
 * with no fraction attached, since they do not represent a decimal quantity.
 * @param {number | string} num the number or numeric string to format
 * @param {number} [decimals] the number of fraction digits to keep; non-positive
 * values are treated as `0`
 * @param {boolean} [trimZeros] when `true`, drop trailing zeroes from the
 * fraction instead of padding to `decimals`; default `false`
 * @returns {string} the formatted number string
 * @example
 * ```ts
 * formatNumber(1234567.891); // => '1,234,567' (truncated without decimals)
 * formatNumber(98765.4321, 2); // => '98,765.43'
 * formatNumber(1234567.891, 3); // => '1,234,567.891'
 * formatNumber(3.14159, 4); // => '3.1416' (honours the requested 4 digits)
 *
 * // Forced precision (default) – always emits `decimals` fraction digits
 * formatNumber(1000, 2); // => '1,000.00'
 * formatMoney(0, 2); // => '0.00'
 *
 * // Dynamic precision – fraction only shown when it is significant
 * formatNumber(1000, 2, true); // => '1,000'
 * formatNumber(1000.5, 2, true); // => '1,000.5'
 * formatNumber(1000.05, 2, true); // => '1,000.05'
 *
 * // Non-finite values never carry a fraction
 * formatNumber(NaN, 2); // => 'NaN'
 * formatNumber(Infinity, 2); // => '∞'
 * ```
 */
export function formatNumber(num: number | string, decimals?: number, trimZeros = false): string {
  const numVal = Number(num);
  // Non-finite values have no meaningful fraction, so render them symbolically
  // before any precision logic runs.
  if (Number.isNaN(numVal)) return 'NaN';
  if (numVal === Infinity) return '∞';
  if (numVal === -Infinity) return '-∞';

  if (isNullish(decimals)) {
    return addThousandsSeparators(parseInt(String(num)));
  }
  let prec = 0;
  if (decimals > 0) {
    prec = decimals;
  }

  // Capture the sign separately so Math.abs() doesn't strip it; -0 must keep
  // its sign to stay consistent with the decimals-less path.
  const isNegative = Object.is(numVal, -0) || numVal < 0;
  const fixedStr = Math.abs(numVal).toFixed(prec);
  const [rawInteger, rawFraction = ''] = fixedStr.split('.');
  const prefix = isNegative ? '-' : '';

  if (prec > 0) {
    const fraction = trimZeros ? trimTrailingZeroes(rawFraction) : padFraction(rawFraction, prec);
    const integerPart = addThousandsSeparators(rawInteger);
    return `${prefix}${integerPart}${fraction ? `.${fraction}` : ''}`;
  }
  return `${prefix}${addThousandsSeparators(rawInteger)}`;
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
