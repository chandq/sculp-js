import bezier, { EasingFunction } from 'bezier-easing';
import { isArray } from './type';

export type EasingDefine = [number, number, number, number];
export type EasingName = 'ease' | 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | string;
export { EasingFunction };

type EasingDefines = Record<string, EasingDefine>;
// @ref https://cubic-bezier.com/
const easingDefines: EasingDefines = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1]
};

type EasingNameOrDefine = EasingName | EasingDefine;

/**
 * 设置缓存定义
 * @param {string} name
 * @param {EasingDefine} define
 */
export function setEasing(name: string, define: EasingDefine): void {
  easingDefines[name] = define;
}

/**
 * 获取缓存定义
 * @param {string} name
 * @returns {EasingDefine | void}
 */
export function getEasing(name: string): EasingDefine | void;
export function getEasing(): EasingDefines;
export function getEasing(name?: string): EasingDefine | EasingDefines | void {
  if (name) return easingDefines[name];
  return easingDefines;
}

/**
 * 缓冲函数化，用于 js 计算缓冲进度
 * @param {EasingNameOrDefine} [name=linear]
 * @returns {EasingFunction}
 */
export function easingFunctional(name: EasingNameOrDefine): EasingFunction {
  let fn: EasingFunction;

  if (isArray(name)) {
    fn = bezier(...name);
  } else {
    const define = easingDefines[name];

    if (!define) {
      throw new Error(`${name} 缓冲函数未定义`);
    }

    fn = bezier(...define);
  }

  return (input: number): number => fn(Math.max(0, Math.min(input, 1)));
}

/**
 * 缓冲字符化，用于 css 设置缓冲属性
 * @param {EasingNameOrDefine} name
 * @returns {string}
 */
export function easingStringify(name: EasingNameOrDefine): string {
  let bezierDefine: EasingDefine;

  if (isArray(name)) {
    bezierDefine = name;
  } else {
    const define = easingDefines[name];

    if (!define) {
      throw new Error(`${name} 缓冲函数未定义`);
    }

    bezierDefine = define;
  }

  return `cubic-bezier(${bezierDefine.join(',')})`;
}
