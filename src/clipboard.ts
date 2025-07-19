import { select } from './dom';
import { AsyncCallback, isFunction, isNullish } from './type';

type CopyTextOptions = AsyncCallback & { container?: HTMLElement };

/**
 * 复制文本，优先使用navigator.clipboard，仅在安全上下文(HTTPS/localhost)下生效，若不支持则回退使用execCommand方式
 * @param {string} text
 * @param {AsyncCallback} options 可选参数：成功回调successCallback、失败回调failCallback、容器元素container
 *                      （默认document.body, 当不支持clipboard时必须传复制按钮元素，包裹模拟选择操作的临时元素，
 *                        解决脱离文档流的元素无法复制的问题，如Modal内复制操作)
 */
export function copyText(text: string, options?: CopyTextOptions): void {
  const { successCallback = void 0, failCallback = void 0 } = isNullish(options) ? {} : options;
  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        if (isFunction(successCallback)) {
          successCallback();
        }
      })
      .catch(err => {
        fallbackCopyText(text, options);
      });
  } else {
    // 使用旧版execCommand方法
    fallbackCopyText(text, options);
  }
}
/**
 * 使用execCommand方式复制文本
 * @param text
 * @param options
 */
export function fallbackCopyText(text: string, options?: CopyTextOptions): void {
  const {
    successCallback = void 0,
    failCallback = void 0,
    container = document.body
  } = isNullish(options) ? {} : options;

  const textEl = createFakeElement(text);
  container.appendChild(textEl);

  select(textEl);

  try {
    const res = document.execCommand('copy');
    if (res && isFunction(successCallback)) {
      successCallback();
    }
  } catch (err) {
    if (isFunction(failCallback)) {
      failCallback(err);
    }
  } finally {
    container.removeChild(textEl);
    window.getSelection()?.removeAllRanges(); // 清除选区
  }
}

/**
 * Creates a fake textarea element with a value.
 * @param {String} value
 * @return {HTMLElement}
 */
function createFakeElement(value) {
  const isRTL = document.documentElement.getAttribute('dir') === 'rtl';
  const fakeElement = document.createElement('textarea');
  // Prevent zooming on iOS
  fakeElement.style.fontSize = '12pt';
  // Reset box model
  fakeElement.style.border = '0';
  fakeElement.style.padding = '0';
  fakeElement.style.margin = '0';
  // Move element out of screen horizontally
  fakeElement.style.position = 'absolute';
  fakeElement.style[isRTL ? 'right' : 'left'] = '-9999px';
  // Move element to the same position vertically
  const yPosition = window.pageYOffset || document.documentElement.scrollTop;
  fakeElement.style.top = `${yPosition}px`;

  fakeElement.setAttribute('readonly', '');
  fakeElement.value = value;

  return fakeElement;
}
