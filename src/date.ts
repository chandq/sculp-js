import { isDate, isNaN, isString } from './type';

export const isValidDate = (any: unknown): any is Date => isDate(any) && !isNaN(any.getTime());

export interface DateObj {
  [propName: string]: string;
}

export type DateValue = number | string | Date;

/* istanbul ignore next */
const guessDateSeparator = (value: DateValue): Date | undefined => {
  if (!isString(value)) return;

  const value2 = value.replace(/-/g, '/');

  return new Date(value2);
};

/* istanbul ignore next */
const guessDateTimezone = (value: DateValue): Date | undefined => {
  if (!isString(value)) return;

  const re = /([+-])(\d\d)(\d\d)$/;

  const matches = re.exec(value);

  if (!matches) return;

  const value2 = value.replace(re, 'Z');
  const d = new Date(value2);

  if (!isValidDate(d)) return;

  const [, flag, hours, minutes] = matches;
  const hours2 = parseInt(hours, 10);
  const minutes2 = parseInt(minutes, 10);
  const offset = (a: number, b: number): number => (flag === '+' ? a - b : a + b);

  d.setHours(offset(d.getHours(), hours2));
  d.setMinutes(offset(d.getMinutes(), minutes2));

  return d;
};

/**
 * 解析为 Date 对象（支持 Safari 兼容性处理）
 * @param {DateValue} value - 时间戳、字符串或 Date 对象
 * @returns {Date}
 */
export function dateParse(value: DateValue): Date {
  const d1 = new Date(value);
  if (isValidDate(d1)) return d1;

  // safari 浏览器的日期解析有问题
  // new Date('2020-06-26 18:06:15') 返回值是一个非法日期对象
  /* istanbul ignore next */
  const d2 = guessDateSeparator(value);
  /* istanbul ignore next */
  if (isValidDate(d2)) return d2;

  // safari 浏览器的日期解析有问题
  // new Date('2020-06-26T18:06:15.000+0800') 返回值是一个非法日期对象
  /* istanbul ignore next */
  const d3 = guessDateTimezone(value);
  /* istanbul ignore next */
  if (isValidDate(d3)) return d3;

  throw new SyntaxError(`${value.toString()} 不是一个合法的日期描述`);
}

/**
 * 日期重置粒度单位，用于 dateToStart / dateToEnd
 * - `year`：年 | `month`：月 | `day`：日（默认）| `hour`：时 | `minute`：分 | `second`：秒
 */
export type DateUnit = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second';

/**
 * 将日期截断到指定粒度的起始时刻（内部使用，毫秒始终归零）
 * @param {DateValue} value - 时间戳、字符串或 Date 对象
 * @param {DateUnit} unit - 重置粒度
 * @returns {Date} 该粒度区间起点的 Date 对象
 */
function startOfUnit(value: DateValue, unit: DateUnit): Date {
  const d = dateParse(value);
  switch (unit) {
    case 'year':
      return new Date(d.getFullYear(), 0, 1);
    case 'month':
      return new Date(d.getFullYear(), d.getMonth(), 1);
    case 'day':
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    case 'hour':
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), 0, 0, 0);
    case 'minute':
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), 0, 0);
    case 'second':
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), 0);
    default:
      throw new Error(`不支持的日期粒度：${String(unit)}`);
  }
}

/**
 * 按指定粒度对日期进行偏移（内部使用，供 dateToEnd 计算下一区间起点）
 * @param {Date} d - 被偏移的 Date 对象（原地修改）
 * @param {DateUnit} unit - 重置粒度
 * @param {number} amount - 偏移数量
 */
function addToUnit(d: Date, unit: DateUnit, amount: number): void {
  switch (unit) {
    case 'year':
      d.setFullYear(d.getFullYear() + amount);
      break;
    case 'month':
      d.setMonth(d.getMonth() + amount);
      break;
    case 'day':
      d.setDate(d.getDate() + amount);
      break;
    case 'hour':
      d.setHours(d.getHours() + amount);
      break;
    case 'minute':
      d.setMinutes(d.getMinutes() + amount);
      break;
    case 'second':
      d.setSeconds(d.getSeconds() + amount);
      break;
  }
}

/**
 * 将日期转换为指定粒度的起始时间，粒度小于等于天时低于粒度的单位全部归零，
 * 粒度大于等于小时时毫秒一并归零。默认按「日」重置（00:00:00.000），与原行为一致。
 * @param {DateValue} value - 时间戳、字符串或 Date 对象
 * @param {DateUnit} [unit] - 重置粒度，默认 `'day'`
 * @returns {Date} 该粒度起始时间的 Date 对象
 * @example
 * ```ts
 * dateToStart('2024-06-15 18:30:45.123'); // => 2024-06-15 00:00:00.000（默认，按日）
 * dateToStart('2024-06-15 18:30:45.123', 'year'); // => 2024-01-01 00:00:00.000
 * dateToStart('2024-06-15 18:30:45.123', 'month'); // => 2024-06-01 00:00:00.000
 * dateToStart('2024-06-15 18:30:45.123', 'hour'); // => 2024-06-15 18:00:00.000
 * dateToStart('2024-06-15 18:30:45.123', 'minute'); // => 2024-06-15 18:30:00.000
 * dateToStart('2024-06-15 18:30:45.123', 'second'); // => 2024-06-15 18:30:45.000
 * ```
 */
export function dateToStart(value: DateValue, unit: DateUnit = 'day'): Date {
  return startOfUnit(value, unit);
}

/**
 * 将日期转换为指定粒度的结束时间（该粒度区间最后一毫秒）。默认按「日」重置
 * （23:59:59.999），与原行为一致。
 * @param {DateValue} value - 时间戳、字符串或 Date 对象
 * @param {DateUnit} [unit] - 重置粒度，默认 `'day'`
 * @returns {Date} 该粒度结束时间的 Date 对象
 * @example
 * ```ts
 * dateToEnd('2024-06-15 18:30:45.123'); // => 2024-06-15 23:59:59.999（默认，按日）
 * dateToEnd('2024-06-15 18:30:45.123', 'year'); // => 2024-12-31 23:59:59.999
 * dateToEnd('2024-02-10 18:30:45.123', 'month'); // => 2024-02-29 23:59:59.999（闰年）
 * dateToEnd('2024-06-15 18:30:45.123', 'hour'); // => 2024-06-15 18:59:59.999
 * dateToEnd('2024-06-15 18:30:45.123', 'minute'); // => 2024-06-15 18:30:59.999
 * dateToEnd('2024-06-15 18:30:45.123', 'second'); // => 2024-06-15 18:30:45.999
 * ```
 */
export function dateToEnd(value: DateValue, unit: DateUnit = 'day'): Date {
  const d = startOfUnit(value, unit);
  addToUnit(d, unit, 1);
  return new Date(d.getTime() - 1);
}

/**
 * 格式化日期为字符串
 * @param {Date} value - 时间戳、字符串或 Date 对象
 * @param {string} [format] - 模板，默认 YYYY-MM-DD HH:mm:ss
 * @returns {string} 格式化后的日期字符串
 *
 * 模板字符说明：
 * - YYYY/yyyy：年 | MM：月（补零）| M：月（不补零）
 * - DD/dd：日（补零）| D/d：日（不补零）
 * - HH：时（24 小时制，补零）| H：时（不补零）
 * - mm/m：分 | ss/s：秒 | SSS/SS/S：毫秒
 * - ww/w：中文星期
 */
export function formatDate(value: DateValue, format = 'YYYY-MM-DD HH:mm:ss'): string {
  const date = dateParse(value);
  let fmt = format;
  let ret;
  const opt: DateObj = {
    'Y+': `${date.getFullYear()}`, // 年
    'y+': `${date.getFullYear()}`, // 年
    'M+': `${date.getMonth() + 1}`, // 月
    'D+': `${date.getDate()}`, // 日
    'd+': `${date.getDate()}`, // 日
    'H+': `${date.getHours()}`, // 时
    'm+': `${date.getMinutes()}`, // 分
    's+': `${date.getSeconds()}`, // 秒
    'S+': `${date.getMilliseconds()}`, // 豪秒
    'w+': ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()] // 周
    // 有其他格式化字符需求可以继续添加，必须转化成字符串
  };

  for (const k in opt) {
    ret = new RegExp('(' + k + ')').exec(fmt);
    if (ret) {
      fmt = fmt.replace(ret[1], ret[1].length === 1 ? opt[k] : opt[k].padStart(ret[1].length, '0'));
    }
  }

  return fmt;
}

export interface CalculateDateOptions {
  /**
   * 输出格式模板（传递给 formatDate 函数处理）
   * 支持以下占位符：
   * - YYYY/yyyy：年 | MM：月（补零）| M：月（不补零）
   * - DD/dd：日（补零）| D/d：日（不补零）
   * - HH：时（24 小时制，补零）| H：时（不补零）
   * - mm/m：分 | ss/s：秒 | SSS/SS/S：毫秒
   * - ww/w：中文星期
   * @default 'YYYY-MM-DD'
   */
  format?: string;
  /**
   * 年数（正数表示向后，负数表示向前）
   * @default 0
   */
  years?: number;
  /**
   * 月数（正数表示向后，负数表示向前）
   * @default 0
   */
  months?: number;
  /**
   * 周数（正数表示向后，负数表示向前）
   * @default 0
   */
  weeks?: number;
  /**
   * 天数（正数表示向后，负数表示向前）
   * @default 0
   */
  days?: number;
  /**
   * 小时数（正数表示向后，负数表示向前）
   * @default 0
   */
  hours?: number;
  /**
   * 分钟数（正数表示向后，负数表示向前）
   * @default 0
   */
  minutes?: number;
  /**
   * 秒数（正数表示向后，负数表示向前）
   * @default 0
   */
  seconds?: number;
  /**
   * 毫秒数（正数表示向后，负数表示向前）
   * @default 0
   */
  milliseconds?: number;
  /**
   * 是否返回 Date 对象而非字符串
   * @default false
   */
  returnDate?: boolean;
}

/**
 * 调整日期（增加或减少特定时间单位）
 * @param {DateValue} originDate - 参考日期，可以是 Date 对象、时间戳或日期字符串
 * @param {CalculateDateOptions} options - 配置项，支持多种时间单位
 * @returns {string | Date} 计算后的日期/日期时间字符串或 Date 对象
 * @example
 * // 基础用法（向后 2 天）
 * adjustDate('2024-01-01', { days: 2 }) // '2024-01-03'
 *
 * // 向前 2 天
 * adjustDate('2024-01-01', { days: -2 }) // '2023-12-30'
 *
 * // 向后 1 年 2 个月 3 天
 * adjustDate('2024-01-01', { years: 1, months: 2, days: 3 }) // '2025-03-04'
 *
 * // 向后 2 周
 * adjustDate('2024-01-01', { weeks: 2 }) // '2024-01-15'
 *
 * // 包含时间（向后 2 天 3 小时 30 分钟）
 * adjustDate('2024-01-01 10:30:00', { days: 2, hours: 3, minutes: 30 }) // '2024-01-03 14:00'
 *
 * // 自定义格式
 * adjustDate('2024-01-01', { days: 2, format: 'YYYY/MM/DD' }) // '2024/01/03'
 * adjustDate('2024-01-01', { days: 2, format: 'YYYY 年 MM 月 DD 日' }) // '2024 年 01 月 03 日'
 *
 * // 时间戳输入
 * adjustDate(1717330884896, { days: 2 }) // '2024-06-04'
 *
 * // 精确到毫秒
 * adjustDate('2024-01-01 10:30:00', { hours: 1, minutes: 30, seconds: 45, milliseconds: 500 })
 *
 * // 返回 Date 对象
 * adjustDate('2024-01-01', { days: 2, returnDate: true }) // Date 对象
 */
export function adjustDate(originDate: DateValue, options: CalculateDateOptions = {}): string | Date {
  const {
    format,
    returnDate = false,
    years = 0,
    months = 0,
    weeks = 0,
    days = 0,
    hours = 0,
    minutes = 0,
    seconds = 0,
    milliseconds = 0
  } = options;

  const date = dateParse(originDate);
  const targetDate = new Date(date);

  // 保存原始日期以便处理月末边界
  const originalDay = date.getDate();
  const originalMonthDays = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const isEndOfMonth = originalDay === originalMonthDays;

  targetDate.setFullYear(targetDate.getFullYear() + years);

  // 处理月末边界：如果原始日期是月末，需要特殊处理
  if (months !== 0) {
    const targetMonthIndex = targetDate.getMonth() + months;
    const targetMonthDays = new Date(targetDate.getFullYear(), targetMonthIndex + 1, 0).getDate();

    // 先将日期设为 1 号，避免 setMonth 时因日期过大而自动进位
    targetDate.setDate(1);
    targetDate.setMonth(targetMonthIndex);

    // 如果原始日期是月末，则调整为目标月份的月末
    if (isEndOfMonth) {
      targetDate.setDate(targetMonthDays);
    } else if (originalDay > targetMonthDays) {
      // 如果原始日期大于目标月份的最大天数，也调整为目标月份的月末
      targetDate.setDate(targetMonthDays);
    } else {
      // 否则保持原始日期
      targetDate.setDate(originalDay);
    }
  }

  // 处理天数（不包括月份变化）
  if (days !== 0 || weeks !== 0) {
    targetDate.setDate(targetDate.getDate() + days + weeks * 7);
  }

  targetDate.setHours(targetDate.getHours() + hours);
  targetDate.setMinutes(targetDate.getMinutes() + minutes);
  targetDate.setSeconds(targetDate.getSeconds() + seconds);
  targetDate.setMilliseconds(targetDate.getMilliseconds() + milliseconds);

  if (returnDate) {
    return targetDate;
  }

  if (format) {
    return formatDate(targetDate, format);
  }

  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  const hoursStr = String(targetDate.getHours()).padStart(2, '0');
  const minutesStr = String(targetDate.getMinutes()).padStart(2, '0');
  const secondsStr = String(targetDate.getSeconds()).padStart(2, '0');

  const hasTimeParam =
    options.hasOwnProperty('hours') ||
    options.hasOwnProperty('minutes') ||
    options.hasOwnProperty('seconds') ||
    options.hasOwnProperty('milliseconds');

  if (hasTimeParam) {
    if (options.hasOwnProperty('milliseconds')) {
      const msStr = String(targetDate.getMilliseconds()).padStart(3, '0');
      return `${year}-${month}-${day} ${hoursStr}:${minutesStr}:${secondsStr}.${msStr}`;
    }
    if (options.hasOwnProperty('seconds')) {
      return `${year}-${month}-${day} ${hoursStr}:${minutesStr}:${secondsStr}`;
    }
    return `${year}-${month}-${day} ${hoursStr}:${minutesStr}`;
  }

  return `${year}-${month}-${day}`;
}

export default {
  isValidDate,
  dateParse,
  dateToStart,
  dateToEnd,
  formatDate,
  adjustDate,
  /**
   * @deprecated 已废弃，请使用 adjustDate
   */
  calculateDate: adjustDate
};
