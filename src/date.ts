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
 * 解析为Date对象
 * @param {DateValue} value - 可以是数值、字符串或 Date 对象
 * @returns {Date} - 转换后的目标Date
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
 * 格式化为日期对象(带自定义格式化模板)
 * @param {DateValue} value 可以是数值、字符串或 Date 对象
 * @param {string} [format] 模板，默认是 YYYY-MM-DD HH:mm:ss，模板字符：
 * - YYYY：年
 * - yyyy: 年
 * - MM：月
 * - DD：日
 * - dd: 日
 * - HH：时（24 小时制）
 * - hh：时（12 小时制）
 * - mm：分
 * - ss：秒
 * - SSS：毫秒
 * @returns {string}
 */
// export const dateStringify = (value: DateValue, format = 'YYYY-MM-DD HH:mm:ss'): string => {
//   const date = dateParse(value);
//   let fmt = format;
//   let ret;
//   const opt: DateObj = {
//     'Y+': `${date.getFullYear()}`, // 年
//     'y+': `${date.getFullYear()}`, // 年
//     'M+': `${date.getMonth() + 1}`, // 月
//     'D+': `${date.getDate()}`, // 日
//     'd+': `${date.getDate()}`, // 日
//     'H+': `${date.getHours()}`, // 时
//     'm+': `${date.getMinutes()}`, // 分
//     's+': `${date.getSeconds()}`, // 秒
//     'S+': `${date.getMilliseconds()}` // 豪秒
//   };

//   for (const k in opt) {
//     ret = new RegExp(`(${k})`).exec(fmt);
//     if (ret) {
//       fmt = fmt.replace(ret[1], ret[1].length === 1 ? opt[k] : opt[k].padStart(ret[1].length, '0'));
//     }
//   }

//   return fmt;
// };

/**
 * 将日期转换为一天的开始时间，即0点0分0秒0毫秒
 * @param {DateValue} value
 * @returns {Date}
 */
export function dateToStart(value: DateValue): Date {
  const d = dateParse(value);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

/**
 * 将日期转换为一天的结束时间，即23点59分59秒999毫秒
 * @param {DateValue} value
 * @returns {Date}
 */
export function dateToEnd(value: DateValue): Date {
  const d = dateToStart(value);
  d.setDate(d.getDate() + 1);
  return dateParse(d.getTime() - 1);
}

/**
 * 格式化为日期对象(带自定义格式化模板)
 * @param {Date} value - 可以是数值、字符串或 Date 对象
 * @param {string} [format] - 模板，默认是 YYYY-MM-DD HH:mm:ss，模板字符：
 * - YYYY：年
 * - yyyy: 年
 * - MM：月
 * - DD：日
 * - dd: 日
 * - HH：时（24 小时制）
 * - hh：时（12 小时制）
 * - mm：分
 * - ss：秒
 * - SSS：毫秒
 * - ww: 周
 * @returns {string}  格式化后的日期字符串
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

/**
 * 计算向前或向后N天的具体日期
 * @param {DateValue} originDate - 参考日期
 * @param {number} n - 正数：向后推算；负数：向前推算
 * @param {string} sep - 日期格式的分隔符
 * @returns {string} 计算后的目标日期
 */
export function calculateDate(originDate: DateValue, n: number, sep: string = '-'): string {
  //originDate 为字符串日期 如:'2019-01-01' n为你要传入的参数，当前为0，前一天为-1，后一天为1
  const date = new Date(originDate); //这边给定一个特定时间
  const newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const millisecondGap = newDate.getTime() + 1000 * 60 * 60 * 24 * parseInt(String(n)); //计算前几天用减，计算后几天用加，最后一个就是多少天的数量
  const targetDate = new Date(millisecondGap);
  const finalNewDate =
    targetDate.getFullYear() +
    sep +
    String(targetDate.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(targetDate.getDate()).padStart(2, '0');
  return finalNewDate;
}

/**
 * 计算向前或向后N天的具体日期时间
 * @param {DateValue} originDateTime - 参考日期时间
 * @param {number} n - 正数：向后推算；负数：向前推算
 * @param {string} dateSep - 日期分隔符
 * @param {string} timeSep - 时间分隔符
 * @returns {string} 转换后的目标日期时间
 */
export function calculateDateTime(
  originDateTime: DateValue,
  n: number,
  dateSep: string = '-',
  timeSep: string = ':'
): string {
  const date = new Date(originDateTime);
  const separator1 = dateSep;
  const separator2 = timeSep;
  const dateTime = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds()
  );
  const millisecondGap = dateTime.getTime() + 1000 * 60 * 60 * 24 * parseInt(String(n)); //计算前几天用减，计算后几天用加，最后一个就是多少天的数量
  const targetDateTime = new Date(millisecondGap);
  return (
    targetDateTime.getFullYear() +
    separator1 +
    String(targetDateTime.getMonth() + 1).padStart(2, '0') +
    separator1 +
    String(targetDateTime.getDate()).padStart(2, '0') +
    ' ' +
    String(targetDateTime.getHours()).padStart(2, '0') +
    separator2 +
    String(targetDateTime.getMinutes()).padStart(2, '0') +
    separator2 +
    String(targetDateTime.getSeconds()).padStart(2, '0')
  );
}
