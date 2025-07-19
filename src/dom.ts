import { arrayEach } from './array';
import { easingFunctional, EasingName } from './easing';
import { objectEach, objectMerge } from './object';
import { stringKebabCase } from './string';
import { isObject, isString } from './type';

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

/**
 * 字符串的像素宽度
 * @param {string} str 目标字符串
 * @param {number} fontSize 字符串字体大小
 * @param {boolean} isRemove 计算后是否移除创建的dom元素
 * @returns {*}
 */
export function getStrWidthPx(str: string, fontSize: number = 14, isRemove: boolean = true): number {
  let strWidth = 0;
  console.assert(isString(str), `${str} 不是有效的字符串`);
  if (isString(str) && str.length > 0) {
    const id = 'getStrWidth1494304949567';
    let getEle: HTMLSpanElement | null = document.querySelector(`#${id}`);
    if (!getEle) {
      const _ele = document.createElement('span');
      _ele.id = id;
      _ele.style.fontSize = fontSize + 'px';
      _ele.style.whiteSpace = 'nowrap';
      _ele.style.visibility = 'hidden';
      _ele.style.position = 'absolute';
      _ele.style.top = '-9999px';
      _ele.style.left = '-9999px';
      _ele.textContent = str;
      document.body.appendChild(_ele);
      getEle = _ele;
    }

    getEle!.textContent = str;
    strWidth = getEle!.offsetWidth;
    if (isRemove) {
      getEle.remove();
    }
  }
  return strWidth;
}
/**
 * Programmatically select the text of a HTML element
 *
 * @param {HTMLElement} element The element whose text you wish to select
 * @returns
 */
export function select(element: HTMLElement) {
  let selectedText;

  if (element.nodeName === 'SELECT') {
    element.focus();
    // @ts-ignore
    selectedText = element.value;
  } else if (element.nodeName === 'INPUT' || element.nodeName === 'TEXTAREA') {
    const isReadOnly = element.hasAttribute('readonly');

    if (!isReadOnly) {
      element.setAttribute('readonly', '');
    }

    // @ts-ignore
    element.select();
    // @ts-ignore
    element.setSelectionRange(0, element.value.length);

    if (!isReadOnly) {
      element.removeAttribute('readonly');
    }

    // @ts-ignore
    selectedText = element.value;
  } else {
    if (element.hasAttribute('contenteditable')) {
      element.focus();
    }

    const selection = window.getSelection();
    const range = document.createRange();

    range.selectNodeContents(element);
    selection!.removeAllRanges();
    selection!.addRange(range);

    selectedText = selection!.toString();
  }

  return selectedText;
}
