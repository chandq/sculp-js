import { objectEach } from './object';
import { AnyObject, isArray, isBoolean, isDate, isNumber, isString, isUndefined } from './type';

export interface Params<T = string | number> {
  [key: string]: T | Array<T>;
}

/**
 * 解析查询参数，内部使用的是浏览器内置的 URLSearchParams 进行处理
 * @param {string} queryString
 * @returns {Params}
 */
export function qsParse(queryString: string): Params {
  const params = new URLSearchParams(queryString);
  const result: Params = {};

  for (const [key, val] of params.entries()) {
    if (isUndefined(result[key])) {
      result[key] = val;
      continue;
    }

    if (isArray(result[key])) {
      continue;
    }

    result[key] = params.getAll(key);
  }

  return result;
}

export type LooseParamValue = string | number | boolean | Date | null | undefined;
export interface LooseParams<T = LooseParamValue> {
  [key: string]: T | Array<T>;
}
export type Replacer = (value: LooseParamValue) => string | null;
const defaultReplacer: Replacer = (val: LooseParamValue) => {
  if (isString(val)) return val;
  if (isNumber(val)) return String(val);
  if (isBoolean(val)) return val ? 'true' : 'false';
  if (isDate(val)) return val.toISOString();
  return null;
};

/**
 * 字符化查询对象，内部使用的是浏览器内置的 URLSearchParams 进行处理
 * @param {LooseParams} query
 * @param {Replacer} replacer
 * @returns {string}
 */
export function qsStringify(query: LooseParams, replacer: Replacer = defaultReplacer): string {
  const params = new URLSearchParams();

  objectEach(query, (val, key) => {
    if (isArray(val)) {
      val.forEach(i => {
        const replaced = replacer(i);

        if (replaced === null) return;

        params.append(key.toString(), replaced);
      });
    } else {
      const replaced = replacer(val);

      if (replaced === null) return;

      params.set(key.toString(), replaced);
    }
  });

  return params.toString();
}
