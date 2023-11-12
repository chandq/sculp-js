import { HEX_POOL, numberToHex } from './number';
import { randomNumber } from './random';
import { isNumber, isString } from './type';

const padStartWithZero = (str: string | number, maxLength = 2): string => String(str).padStart(maxLength, '0');
let safeNo = 0;
let lastTimestamp = 0;
// 安全后缀长度，按 1 毫秒运算 99999 次 JS 代码来进行估算
// 那么，补足长度为 5
// 时间戳模式长度为 13
// 取最长 5 + 13 = 18
export const UNIQUE_NUMBER_SAFE_LENGTH = 18;
const FIX_SAFE_LENGTH = 5;
const TIMESTAMP_LENGTH = 13;

/**
 * 生成唯一不重复数值
 * @param {number} length
 * @returns {string}
 */
export const uniqueNumber = (length: number = UNIQUE_NUMBER_SAFE_LENGTH): string => {
  const now = Date.now();

  length = Math.max(length, UNIQUE_NUMBER_SAFE_LENGTH);

  if (now !== lastTimestamp) {
    lastTimestamp = now;
    safeNo = 0;
  }

  const timestamp = `${now}`;
  let random = '';
  const rndLength = length - FIX_SAFE_LENGTH - TIMESTAMP_LENGTH;

  if (rndLength > 0) {
    const rndMin = 10 ** (rndLength - 1);
    const rndMax = 10 ** rndLength - 1;
    const rnd = randomNumber(rndMin, rndMax);
    random = `${rnd}`;
  }

  const safe = padStartWithZero(safeNo, FIX_SAFE_LENGTH);

  safeNo++;

  return `${timestamp}${random}${safe}`;
};

export interface UniqueString {
  (length: number, pool: string): string;
  (length: number): string;
  (pool: string): string;
  (): string;
}

const randomFromPool = (pool: string): string => {
  const poolIndex = randomNumber(0, pool.length - 1);

  return pool[poolIndex];
};

/**
 * 生成唯一不重复字符串
 * @param {number | string} length
 * @param {string} pool
 * @returns {string}
 */
export const uniqueString: UniqueString = (length?: number | string, pool?: string) => {
  let _length = 0;
  let _pool = HEX_POOL;

  if (isString(pool)) {
    _length = length as number;
    _pool = pool;
  } else if (isNumber(length)) {
    _length = length;
  } else if (isString(length)) {
    _pool = length;
  }

  let uniqueString = numberToHex(uniqueNumber(), _pool);
  let insertLength = _length - uniqueString.length;

  if (insertLength <= 0) return uniqueString;

  while (insertLength--) {
    uniqueString += randomFromPool(_pool);
  }

  return uniqueString;
};
