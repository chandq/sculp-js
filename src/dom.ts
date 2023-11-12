import { arrayEach } from './array';
import { easingFunctional, EasingName } from './easing';
import { objectEach, objectMerge } from './object';
import { stringKebabCase } from './string';
import { isObject } from './type';

export interface Style {
  [propName: string]: string | number;
}

/**
 * 判断元素是否包含某个样式名
 * @param {HTMLElement} el
 * @param {string} className
 * @returns {boolean}
 */
export function hasClass(el: HTMLElement, className: string): boolean {
  if (className.indexOf(' ') !== -1) throw new Error('className should not contain space.');
  return el.classList.contains(className);
}

const eachClassName = (classNames: string, func: (className: string) => void): void => {
  const classNameList = classNames.split(/\s+/g);

  classNameList.forEach(func);
};

/**
 * 给元素增加样式名
 * @param {HTMLElement} el
 * @param {string} classNames
 */
export function addClass(el: HTMLElement, classNames: string): void {
  eachClassName(classNames, className => el.classList.add(className));
}

/**
 * 给元素移除样式名
 * @param {HTMLElement} el
 * @param {string} classNames
 */
export function removeClass(el: HTMLElement, classNames: string): void {
  eachClassName(classNames, className => el.classList.remove(className));
}

export interface SetStyle {
  (el: HTMLElement, key: string, val: string): void;
  (el: HTMLElement, style: Style): void;
}

/**
 * 设置元素样式
 * @param {HTMLElement} el
 * @param {string | Style} key
 * @param {string} val
 */
export const setStyle: SetStyle = (el: HTMLElement, key: string | Style, val?: string) => {
  if (isObject(key)) {
    objectEach(key, (val1, key1) => {
      setStyle(el, key1, val1 as string);
    });
  } else {
    el.style.setProperty(stringKebabCase(key), val as string);
  }
};

/**
 * 获取元素样式
 * @param {HTMLElement} el 元素
 * @param {string} key
 * @returns {string}
 */
export function getStyle(el: HTMLElement, key: string): string {
  return getComputedStyle(el).getPropertyValue(key);
}

type ScrollElement = HTMLElement | Document | Window;
export interface SmoothScrollOptions {
  // 滚动元素，默认：document
  el: ScrollElement;
  // 滚动位置，默认：0
  to: number;
  // 时长，单位毫秒，默认：567
  duration: number;
  // 缓冲名称，默认：ease
  easing: EasingName;
}

export function smoothScroll(options?: Partial<SmoothScrollOptions>): Promise<void> {
  return new Promise(resolve => {
    const defaults: SmoothScrollOptions = {
      el: document,
      to: 0,
      duration: 567,
      easing: 'ease'
    };
    const { el, to, duration, easing } = objectMerge<SmoothScrollOptions>(defaults, options);
    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    const globalMode = el === window || el === document || el === htmlEl || el === bodyEl;
    const els: ScrollElement[] = globalMode ? [htmlEl, bodyEl] : [el];
    const query = () => {
      let value = 0;

      arrayEach(els, el => {
        if ('scrollTop' in el) {
          value = el.scrollTop;
          return false;
        }
      });

      return value;
    };
    const update = (val: number) => {
      els.forEach(el => {
        if ('scrollTop' in el) {
          el.scrollTop = val;
        }
      });
    };
    let startTime: number;
    const startValue = query();
    const length = to - startValue;
    const easingFn = easingFunctional(easing);
    const render = () => {
      const now = performance.now();
      const passingTime = startTime ? now - startTime : 0;
      const t = passingTime / duration;
      const p = easingFn(t);

      if (!startTime) startTime = now;

      update(startValue + length * p);

      if (t >= 1) resolve();
      else requestAnimationFrame(render);
    };

    render();
  });
}

export type ReadyCallback = () => void;
const domReadyCallbacks: ReadyCallback[] = [];
const eventType = 'DOMContentLoaded';
const listener = () => {
  domReadyCallbacks.forEach(callback => callback());
  domReadyCallbacks.length = 0;
  document.removeEventListener(eventType, listener);
};
document.addEventListener(eventType, listener);

let readied = false;
export function isDomReady(): boolean {
  if (readied) return true;
  readied = ['complete', 'loaded', 'interactive'].indexOf(document.readyState) !== -1;
  return readied;
}

export function onDomReady(callback: ReadyCallback): void {
  // document readied
  if (isDomReady()) {
    setTimeout(callback, 0);
  }
  // listen document to ready
  else {
    domReadyCallbacks.push(callback);
  }
}

/**
 * 获取元素样式属性的计算值
 * @param {HTMLElement} el
 * @param {string} property
 * @param {boolean} reNumber
 * @returns {string|number}
 */
export function getComputedCssVal(el: HTMLElement, property: string, reNumber: boolean = true): string | number {
  const originVal = getComputedStyle(el).getPropertyValue(property) ?? '';
  return reNumber ? Number(originVal.replace(/([0-9]*)(.*)/g, '$1')) : originVal;
}
