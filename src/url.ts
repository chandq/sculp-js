import { AnyObject, isFunction } from './type';
import { pathJoin } from './path';
import { Params, qsParse as parseSearchParams, qsStringify as stringifySearchParams } from './qs';

export interface Url {
  protocol: string;
  auth: string;
  username: string;
  password: string;
  host: string;
  port: string;
  hostname: string;
  hash: string;
  search: string;
  searchParams: Params;
  query: string;
  pathname: string;
  path: string;
  href: string;
}

/**
 * url 解析
 * @param {string} url
 * @param {boolean} isModernApi 使用现代API:URL, 默认true (对无效url解析会抛错), 否则使用a标签来解析（兼容性更强）
 * @returns {Url}
 */
export const urlParse = (url: string, isModernApi: boolean = true): Url => {
  let urlObj: Nullable<URL | HTMLAnchorElement> = null;

  if (isFunction(URL) && isModernApi) {
    urlObj = new URL(url);
  } else {
    urlObj = document.createElement('a');
    urlObj.href = url;
  }
  const { protocol, username, password, host, port, hostname, hash, search, pathname: _pathname } = urlObj;
  // fix: ie 浏览器下，解析出来的 pathname 是没有 / 根的
  const pathname = pathJoin('/', _pathname);
  const auth = username && password ? `${username}:${password}` : '';
  const query = search.replace(/^\?/, '');
  const searchParams = parseSearchParams(query);
  const path = `${pathname}${search}`;
  urlObj = null;

  return {
    protocol,
    auth,
    username,
    password,
    host,
    port,
    hostname,
    hash,
    search,
    searchParams,
    query,
    pathname,
    path,
    href: url
  };
};

/**
 * url 字符化，url 对象里的 searchParams 会覆盖 url 原有的查询参数
 * @param {Url} url
 * @returns {string}
 */
export const urlStringify = (url: Url): string => {
  const { protocol, auth, host, pathname, searchParams, hash } = url;
  const authorize = auth ? `${auth}@` : '';
  const querystring = stringifySearchParams(searchParams);
  const search = querystring ? `?${querystring}` : '';
  let hashstring = hash.replace(/^#/, '');
  hashstring = hashstring ? '#' + hashstring : '';

  return `${protocol}//${authorize}${host}${pathname}${search}${hashstring}`;
};

/**
 * 设置 url 查询参数
 * @param {string} url
 * @param {AnyObject} setter
 * @returns {string}
 */
export const urlSetParams = (url: string, setter: AnyObject): string => {
  const p = urlParse(url);
  Object.assign(p.searchParams, setter);
  return urlStringify(p);
};

/**
 * 删除 url 查询参数
 * @param {string} url
 * @param {string[]} removeKeys
 * @returns {string}
 */
export const urlDelParams = (url: string, removeKeys: string[]): string => {
  const p = urlParse(url);
  removeKeys.forEach(key => delete p.searchParams[key]);
  return urlStringify(p);
};
