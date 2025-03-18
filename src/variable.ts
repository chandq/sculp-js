import { objectHas } from './type';

/**
 * 去除字符串中重复字符
 * @param {string} str
 * @returns string
 * @example
 *
 * uniqueSymbol('1a1bac');
 * // => '1abc'
 */
export function uniqueSymbol(str: string): string {
  return [...new Set(str.trim().split(''))].join('');
}
/**
 * 转义所有特殊字符
 * @param {string} str 原字符串
 *  reference: https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Regular_expressions
 * @returns string
 */
export function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); //$&表示整个被匹配的字符串
}
/**
 * 根据左右匹配符号生产解析变量(自动删除变量内的空白)
 * @param {string} leftMatchSymbol
 * @param {string} rightMatchSymbol
 * @returns RegExp
 */
function parseVariableRegExp(leftMatchSymbol: string, rightMatchSymbol: string): RegExp {
  return new RegExp(
    `${escapeRegExp(leftMatchSymbol.trim())}\\s*([^${escapeRegExp(uniqueSymbol(leftMatchSymbol))}${escapeRegExp(
      uniqueSymbol(rightMatchSymbol)
    )}\\s]*)\\s*${rightMatchSymbol.trim()}`,
    'g'
  );
}

/**
 * 解析字符串的插值变量
 * @param {string} str 字符串
 * @param {string} leftMatchSymbol 变量左侧匹配符号，默认：{
 * @param {string} rightMatchSymbol 变量右侧匹配符号，默认：}
 * @returns string[]
 * @example
 *
 * default match symbol {} same as /{\s*([^{}\s]*)\s*}/g
 */
export function parseVarFromString(
  str: string,
  leftMatchSymbol: string = '{',
  rightMatchSymbol: string = '}'
): string[] {
  return Array.from(str.matchAll(parseVariableRegExp(leftMatchSymbol, rightMatchSymbol))).map(el => el?.[1]);
}
/**
 * 替换字符串中的插值变量
 * @param {string} sourceStr
 * @param {Record<string, any>} targetObj
 * @param {string} leftMatchSymbol 变量左侧匹配符号，默认：{
 * @param {string} rightMatchSymbol 变量右侧匹配符号，默认：}
 * @returns string
 */
export function replaceVarFromString(
  sourceStr: string,
  targetObj: Record<string, any>,
  leftMatchSymbol: string = '{',
  rightMatchSymbol: string = '}'
): string {
  return sourceStr.replace(new RegExp(parseVariableRegExp(leftMatchSymbol, rightMatchSymbol)), function (m, p1) {
    return objectHas(targetObj, p1) ? targetObj[p1] : m;
  });
}

/**
 * 在指定作用域中执行代码
 * @param {string} code 要执行的代码（需包含 return 语句或表达式）
 * @param {Object} scope 作用域对象（键值对形式的变量环境）
 * @returns 代码执行结果
 *
 * @example
 * // 测试用例 1: 基本变量访问
 * executeInScope("return a + b;", { a: 1, b: 2 });
 * // 3
 *
 * // 测试用例 2: 支持复杂表达式和运算
 * executeInScope(
 * "return Array.from({ length: 3 }, (_, i) => base + i);",
 * { base: 100 }
 * );
 * // [100, 101, 102]
 *
 * // 支持外传函数作用域执行
 * const scope = {
 *  $: {
 *    fun: {
 *      time: {
 *        now: function () {
 *          return new Date();
 *        },
 *      },
 *    },
 *  },
 * };
 * executeInScope("return $.fun.time.now()", scope)
 */
export function executeInScope(code: string, scope: Record<string, any> = {}) {
  // 提取作用域对象的键和值
  const keys = Object.keys(scope);
  const values = keys.map(key => scope[key]);

  try {
    // 动态创建函数，将作用域的键作为参数，代码作为函数体
    const func = new Function(...keys, `return (() => { ${code} })()`);
    // 调用函数并传入作用域的值
    return func(...values);
  } catch (error: any) {
    throw new Error(`代码执行失败: ${error.message}`);
  }
}
