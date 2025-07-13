import { AsyncCallback, isFunction, isNullish } from './type';

/**
 * 复制文本，优先使用navigator.clipboard，若不支持则回退使用execCommand方式
 * @param {string} text
 * @param {AsyncCallback} options 可选参数：成功回调、失败回调
 */
export function copyText(text: string, options?: AsyncCallback): void {
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
export function fallbackCopyText(text: string, options?: AsyncCallback): void {
  const { successCallback = void 0, failCallback = void 0 } = isNullish(options) ? {} : options;

  const textEl = document.createElement('textarea');
  textEl.style.position = 'absolute';
  textEl.style.top = '-9999px';
  textEl.style.left = '-9999px';
  textEl.style.opacity = '0';
  textEl.value = text;
  document.body.appendChild(textEl);
  textEl.focus({ preventScroll: true });
  textEl.select();

  try {
    document.execCommand('copy');
    textEl.blur();
    if (isFunction(successCallback)) {
      successCallback();
    }
  } catch (err) {
    if (isFunction(failCallback)) {
      failCallback(err);
    }
  } finally {
    document.body.removeChild(textEl);
  }
}
