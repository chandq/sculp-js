import { STRING_ARABIC_NUMERALS, STRING_LOWERCASE_ALPHA, STRING_UPPERCASE_ALPHA } from './string';
import { isNumber, isString } from './type';

/**
 * 随机整数
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export const randomNumber = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1) + min);

export const STRING_POOL = `${STRING_ARABIC_NUMERALS}${STRING_UPPERCASE_ALPHA}${STRING_LOWERCASE_ALPHA}`;

export interface RandomString {
  (length: number, pool: string): string;
  (length: number): string;
  (pool: string): string;
  (): string;
}

/**
 * 随机字符串
 * @param {number | string} length
 * @param {string} pool
 * @returns {string}
 */
export const randomString: RandomString = (length?: number | string, pool?: string): string => {
  let _length = 0;
  let _pool = STRING_POOL;

  if (isString(pool)) {
    _length = length as number;
    _pool = pool;
  } else if (isNumber(length)) {
    _length = length;
  } else if (isString(length)) {
    _pool = length;
  }

  let times = Math.max(_length, 1);
  let result = '';
  const min = 0;
  const max = _pool.length - 1;

  if (max < 2) throw new Error('字符串池长度不能少于 2');

  while (times--) {
    const index = randomNumber(min, max);
    result += _pool[index];
  }

  return result;
};

/**
 * 优先浏览器原生能力获取 UUID v4
 * @returns {string}
 */
export function randomUuid(): string {
  if (typeof URL === 'undefined' || !URL.createObjectURL || typeof Blob === 'undefined') {
    const hex = '0123456789abcdef';
    const model = 'xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx';
    let str = '';

    for (let i = 0; i < model.length; i++) {
      const rnd = randomNumber(0, 15);
      str += model[i] == '-' || model[i] == '4' ? model[i] : hex[rnd];
    }
    return str;
  }

  return /[^/]+$/.exec(URL.createObjectURL(new Blob()).slice())![0];
}
