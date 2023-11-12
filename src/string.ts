import { AnyObject, isString } from './type';

/**
 * 将字符串转换为驼峰格式
 * @param {string} string
 * @param {boolean} [bigger] 是否大写第一个字母
 * @returns {string}
 */
export function stringCamelCase(string: string, bigger?: boolean): string {
  let string2 = string;

  if (bigger) {
    string2 = string.replace(/^./, origin => origin.toUpperCase());
  }

  const HUMP_RE = /[\s_-](.)/g;

  return string2.replace(HUMP_RE, (orign, char) => (char as string).toUpperCase());
}

/**
 * 将字符串转换为连字格式
 * @param {string} string
 * @param {string} [separator] 分隔符，默认是"-"（短横线）
 * @returns {string}
 */
export function stringKebabCase(string: string, separator = '-'): string {
  const string2 = string.replace(/^./, origin => origin.toLowerCase());

  return string2.replace(/[A-Z]/g, origin => `${separator}${origin.toLowerCase()}`);
}

export const STRING_ARABIC_NUMERALS = '0123456789';
export const STRING_LOWERCASE_ALPHA = 'abcdefghijklmnopqrstuvwxyz';
export const STRING_UPPERCASE_ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const placeholderRE = /%[%sdo]/g;
/**
 * 字符串格式化
 * @example
 * ```js
 * stringFormat("My name is %s.", "zhangsan")
 * // => "My name is zhangsan."
 * ```
 * @param {string} string 字符串模板，使用 %s 表示字符串，%d 表示数值，%o 表示对象，%% 表示百分号，参考 console.log
 * @param args
 * @returns {string}
 */
export function stringFormat(string: string, ...args: Array<unknown>): string {
  let index = 0;
  const result = string.replace(placeholderRE, (origin: string): string => {
    const arg = args[index++];

    switch (origin) {
      case '%%':
        index--;
        return '%';
      default:
      case '%s':
        return String(arg);
      case '%d':
        return String(Number(arg));
      case '%o':
        return JSON.stringify(arg);
    }
  });

  return [result, ...args.splice(index).map(String)].join(' ');
}

const ev = (expression: string, data: AnyObject): string => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval,@typescript-eslint/no-unsafe-return
    return new Function(
      'with(arguments[0]){' +
        /****/ `if(arguments[0].${expression} === undefined)throw "";` +
        /****/
        /****/ `return String(arguments[0].${expression})` +
        '}'
    )(data);
  } catch (err) {
    throw new SyntaxError(`无法执行表达式：${expression}`);
  }
};
const templateRE = /\${(.*?)}/g;

/**
 * 字符串赋值
 * @example
 * ```js
 * stringAssign('My name is ${user}.', { user: 'zhangsan' });
 * // => "My name is zhangsan."
 * ```
 * @param {string} template
 * @param {AnyObject} data
 * @returns {string}
 */
export const stringAssign = (template: string, data: AnyObject): string => {
  return template.replace(templateRE, (origin, expression) => ev(expression, data));
};

/**
 * 字符串编码 HTML
 * @example
 * ```js
 * stringEscapeHtml('<b>You & Me speak "xixi"</b>')
 * // => "&lt;b&gt;You &amp; Me speak &quot;xixi&quot;&lt;/b&gt;"
 * ```
 * @param {string} html
 * @returns {string}
 */
export const stringEscapeHtml = (html: string): string => {
  const htmlCharRE = /[&<>"]/g;
  const htmlCharReplacements = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  };

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return html.replace(htmlCharRE, $0 => htmlCharReplacements[$0]);
};

/**
 * 字符串填充
 * @param {number} length
 * @param {string} value
 * @returns {string}
 */
export const stringFill = (length: number, value = ' '): string => new Array(length).fill(value).join('');

/**
 * 字符串的像素宽度
 * @param {string} str 目标字符串
 * @param {number} fontSize 字符串字体大小
 * @param {boolean} isRemoveDom 计算后是否移除中间dom元素
 * @returns {*}
 */
export function getStrWidthPx(str: string, fontSize: number = 14, isRemoveDom: boolean = false): number {
  let strWidth = 0;
  console.assert(isString(str), `${str} 不是有效的字符串`);
  if (isString(str) && str.length > 0) {
    let getEle: HTMLSpanElement | null = document.querySelector('#getStrWidth1494304949567');
    if (!getEle) {
      const _ele = document.createElement('span');
      _ele.id = 'getStrWidth1494304949567';
      _ele.style.fontSize = fontSize + 'px';
      _ele.style.whiteSpace = 'nowrap';
      _ele.style.visibility = 'hidden';
      _ele.textContent = str;
      document.body.appendChild(_ele);
      getEle = _ele;
    }

    getEle!.textContent = str;
    strWidth = getEle!.offsetWidth;
    if (isRemoveDom) {
      document.body.appendChild(getEle);
    }
  }
  return strWidth;
}
