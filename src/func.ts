import { AnyArray, AnyFunc, isError } from './type';

export interface DebounceFunc<F extends AnyFunc> {
  (...args: Parameters<F>): void;
  cancel: () => void;
}

/**
 * 防抖函数
 * 当函数被连续调用时，该函数并不执行，只有当其全部停止调用超过一定时间后才执行1次。
 * 例如：上电梯的时候，大家陆陆续续进来，电梯的门不会关上，只有当一段时间都没有人上来，电梯才会关门。
 * @param {F} func
 * @param {number} wait
 * @returns {DebounceFunc<F>}
 */
export const debounce = <F extends AnyFunc>(func: F, wait?: number): DebounceFunc<F> => {
  let timeout: any;
  let canceled = false;
  const f = function (...args: AnyArray): void {
    if (canceled) return;

    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.call(this, ...args);
    }, wait);
  };

  f.cancel = (): void => {
    clearTimeout(timeout);
    canceled = true;
  };

  return f;
};

export interface ThrottleFunc<F extends AnyFunc> {
  (...args: Parameters<F>): void;
  cancel: () => void;
}

/**
 * 节流函数
 * 节流就是节约流量，将连续触发的事件稀释成预设评率。 比如每间隔1秒执行一次函数，无论这期间触发多少次事件。
 * 这有点像公交车，无论在站点等车的人多不多，公交车只会按时来一班，不会来一个人就来一辆公交车。
 * @param {F} func
 * @param {number} wait
 * @param {boolean} immediate
 * @returns {ThrottleFunc<F>}
 */
export const throttle = <F extends AnyFunc>(func: F, wait: number, immediate?: boolean): ThrottleFunc<F> => {
  let timeout: any;
  let canceled = false;
  let lastCalledTime = 0;

  const f = function (...args: AnyArray) {
    if (canceled) return;

    const now = Date.now();
    const call = () => {
      lastCalledTime = now;
      func.call(this, ...args);
    };

    // 第一次执行
    if (lastCalledTime === 0) {
      if (immediate) {
        return call();
      } else {
        lastCalledTime = now;
        return;
      }
    }

    const remain = lastCalledTime + wait - now;

    if (remain > 0) {
      clearTimeout(timeout);
      timeout = setTimeout(() => call(), wait);
    } else {
      call();
    }
  };

  f.cancel = (): void => {
    clearTimeout(timeout);
    canceled = true;
  };

  return f;
};

export interface OnceFunc<F extends AnyFunc> {
  (...args: Parameters<F>): ReturnType<F>;
}

/**
 * 单次函数
 * @param {AnyFunc} func
 * @returns {AnyFunc}
 */
export const once = <F extends AnyFunc = AnyFunc>(func: F): OnceFunc<F> => {
  let called = false;
  let result: ReturnType<F>;

  return function (...args) {
    if (called) return result;

    called = true;
    result = func.call(this, ...args);
    return result;
  };
};

/**
 * 设置全局变量
 * @param {string | number | symbol} key
 * @param val
 */
export function setGlobal(key: string | number | symbol, val?: any) {
  if (typeof globalThis !== 'undefined') globalThis[key] = val;
  else if (typeof window !== 'undefined') window[key] = val;
  else if (typeof global !== 'undefined') global[key] = val;
  else if (typeof self !== 'undefined') self[key] = val;
  else throw new SyntaxError('当前环境下无法设置全局属性');
}

/**
 * 获取全局变量
 * @param {string | number | symbol} key
 * @param val
 */
export function getGlobal<T>(key: string | number | symbol): T | void {
  if (typeof globalThis !== 'undefined') return globalThis[key] as T;
  else if (typeof window !== 'undefined') return window[key] as T;
  else if (typeof global !== 'undefined') return global[key] as T;
  else if (typeof self !== 'undefined') return self[key] as T;
}
