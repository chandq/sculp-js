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
 * - ww: 周
 * @returns {string}
 */
export const formatDate = (date = new Date(), format = 'YYYY-MM-DD HH:mm:ss'): string => {
  let fmt = format;
  let ret;
  const opt = {
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
};

/**
 * 计算向前或向后N天的具体日期
 * @param {string} strDate 参考日期
 * @param {number} n 正数：向后推算；负数：向前推算
 * @param {string} sep 日期格式的分隔符
 * @return {*} 目标日期
 */
export function calculateDate(strDate: string, n: number, sep: string = '-'): string {
  //strDate 为字符串日期 如:'2019-01-01' n为你要传入的参数，当前为0，前一天为-1，后一天为1
  const dateArr = strDate.split(sep); //这边给定一个特定时间
  const newDate = new Date(+dateArr[0], +dateArr[1] - 1, +dateArr[2]);
  const befminuts = newDate.getTime() + 1000 * 60 * 60 * 24 * parseInt(String(n)); //计算前几天用减，计算后几天用加，最后一个就是多少天的数量
  const beforeDat = new Date();
  beforeDat.setTime(befminuts);
  const befMonth = beforeDat.getMonth() + 1;
  const mon = befMonth >= 10 ? befMonth : '0' + befMonth;
  const befDate = beforeDat.getDate();
  const da = befDate >= 10 ? befDate : '0' + befDate;
  const finalNewDate = beforeDat.getFullYear() + '-' + mon + '-' + da;
  return finalNewDate;
}

/**
 * 计算向前或向后N天的具体时间日期
 * @param {number} n 正数：向后推算；负数：向前推算
 * @param {string} dateSep 日期分隔符
 * @param {string} timeSep 时间分隔符
 * @return {*}
 */
export function calculateDateTime(n: number, dateSep: string = '-', timeSep: string = ':'): string {
  const date = new Date();
  const separator1 = '-';
  const separator2 = ':';
  let year = date.getFullYear();
  let month: number | string = date.getMonth() + 1;
  let strDate: number | string = date.getDate() + n;
  if (strDate > new Date(year, month, 0).getDate()) {
    month += 1;
    strDate -= new Date(year, month, 0).getDate();
    if (month > 12) {
      year += 1;
      month = 1;
    }
  }
  if (month >= 1 && month <= 9) {
    month = '0' + month;
  }
  if (strDate >= 0 && strDate <= 9) {
    strDate = '0' + strDate;
  }
  return (
    year +
    separator1 +
    month +
    separator1 +
    strDate +
    ' ' +
    date.getHours() +
    separator2 +
    date.getMinutes() +
    separator2 +
    date.getSeconds()
  );
}
