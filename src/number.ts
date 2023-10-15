/**
 * 将数字格式化成千位分隔符显示的字符串
 * @param {number} val 数字
 * @param {'int' | 'float'} type 展示分段显示的类型 int:整型 | float:浮点型
 * @return {string}
 */
export function numberFormat(val: number, type = 'int'): string {
  return type === 'int' ? parseInt(String(val)).toLocaleString() : Number(val).toLocaleString('en-US')
}