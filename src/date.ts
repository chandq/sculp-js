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
 * 将日期转换为一天的开始时间（00:00:00.000）
 * @param {DateValue} value
 * @returns {Date}
 */
export function dateToStart(value: DateValue): Date {
  const d = dateParse(value);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

/**
 * 将日期转换为一天的结束时间（23:59:59.999）
 * @param {DateValue} value
 * @returns {Date}
 */
export function dateToEnd(value: DateValue): Date {
  const d = dateToStart(value);
  d.setDate(d.getDate() + 1);
  return dateParse(d.getTime() - 1);
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
