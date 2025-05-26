/**
 * 复制文本
 * @param {string} text
 */
export function copyText(text: string): void {
  const textEl = document.createElement('textarea');

  textEl.style.position = 'absolute';
  textEl.style.top = '-9999px';
  textEl.style.left = '-9999px';
  textEl.value = text;
  document.body.appendChild(textEl);
  textEl.focus({ preventScroll: true });
  textEl.select();

  try {
    document.execCommand('copy');
    textEl.blur();
    document.body.removeChild(textEl);
  } catch (err) {
    // ignore
  }
}
