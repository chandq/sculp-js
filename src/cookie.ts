import { isDate, isNumber } from './type';

/**
 * 获取cookie
 * @param {string} name
 * @returns {string}
 */
export function cookieGet(name: string): string {
  const { cookie } = document;

  if (!cookie) return '';

  const result = cookie.split(';');

  for (let i = 0; i < result.length; i++) {
    const item = result[i];
    const [key, val = ''] = item.split('=');

    if (key === name) return decodeURIComponent(val);
  }

  return '';
}

/**
 * 设置 cookie
 * @param {string} name
 * @param {string} value
 * @param {number | Date} [maxAge]
 */
export function cookieSet(name: string, value: string, maxAge?: number | Date): void {
  const metas: any = [];
  const EXPIRES = 'expires';

  metas.push([name, encodeURIComponent(value)]);

  if (isNumber(maxAge)) {
    const d = new Date();
    d.setTime(d.getTime() + maxAge);
    metas.push([EXPIRES, d.toUTCString()]);
  } else if (isDate(maxAge)) {
    metas.push([EXPIRES, maxAge.toUTCString()]);
  }

  metas.push(['path', '/']);

  document.cookie = metas
    .map(item => {
      const [key, val] = item;
      return `${key}=${val}`;
    })
    .join(';');
}

/**
 * 删除单个 cookie
 * @param name cookie 名称
 */
export const cookieDel = (name: string): void => cookieSet(name, '', -1);
