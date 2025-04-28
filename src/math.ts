/**
 * 数值安全乘法
 * @param arg1 数值1
 * @param arg2 数值2
 */
export const multiply = (arg1: number, arg2: number): number => {
  let m = 0;
  const s1 = arg1.toString();
  const s2 = arg2.toString();

  if (s1.split('.')[1] !== undefined) m += s1.split('.')[1].length;
  if (s2.split('.')[1] !== undefined) m += s2.split('.')[1].length;

  return (Number(s1.replace('.', '')) * Number(s2.replace('.', ''))) / Math.pow(10, m);
};

/**
 * 数值安全加法
 * @param arg1 数值1
 * @param arg2 数值2
 */
export const add = (arg1: number, arg2: number): number => {
  let r1 = 0;
  let r2 = 0;
  let m = 0;

  try {
    r1 = arg1.toString().split('.')[1].length;
  } catch (e) {
    r1 = 0;
  }

  try {
    r2 = arg2.toString().split('.')[1].length;
  } catch (e) {
    r2 = 0;
  }

  m = 10 ** Math.max(r1, r2);

  return (multiply(arg1, m) + multiply(arg2, m)) / m;
};

/**
 * 数值安全减法
 * @param arg1 数值1
 * @param arg2 数值2
 */
export const subtract = (arg1: number, arg2: number): number => add(arg1, -arg2);

/**
 * 数值安全除法
 * @param arg1 数值1
 * @param arg2 数值2
 */
export const divide = (arg1: number, arg2: number): number => {
  let t1 = 0;
  let t2 = 0;
  let r1 = 0;
  let r2 = 0;

  if (arg1.toString().split('.')[1] !== undefined) t1 = arg1.toString().split('.')[1].length;
  if (arg2.toString().split('.')[1] !== undefined) t2 = arg2.toString().split('.')[1].length;

  r1 = Number(arg1.toString().replace('.', ''));
  r2 = Number(arg2.toString().replace('.', ''));

  return (r1 / r2) * Math.pow(10, t2 - t1);
};

type NumberType = number | string;

/**
 * Correct the given number to specifying significant digits.
 *
 * @param num The input number
 * @param precision An integer specifying the number of significant digits
 *
 * @example strip(0.09999999999999998) === 0.1 // true
 */
export function strip(num: NumberType, precision = 15): number {
  return +parseFloat(Number(num).toPrecision(precision));
}
