import { getGlobal } from './func';
import { isNullOrUnDef } from './type';

const b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
// eslint-disable-next-line
const b64re = /^(?:[A-Za-z\d+\/]{4})*?(?:[A-Za-z\d+\/]{2}(?:==)?|[A-Za-z\d+\/]{3}=?)?$/;
/**
 * 字符串编码成Base64, 平替浏览器的btoa, 不包含中文的处理 （适用于任何环境，包括小程序）
 * @param {string} string
 * @returns {string}
 */
export function weBtoa(string: string): string {
  // 同window.btoa: 字符串编码成Base64
  string = String(string);
  let bitmap,
    a,
    b,
    c,
    result = '',
    i = 0;
  const strLen = string.length;
  const rest = strLen % 3;
  for (; i < strLen; ) {
    if ((a = string.charCodeAt(i++)) > 255 || (b = string.charCodeAt(i++)) > 255 || (c = string.charCodeAt(i++)) > 255)
      throw new TypeError(
        "Failed to execute 'btoa' on 'Window': The string to be encoded contains characters outside of the Latin1 range."
      );
    bitmap = (a << 16) | (b << 8) | c;
    result +=
      b64.charAt((bitmap >> 18) & 63) +
      b64.charAt((bitmap >> 12) & 63) +
      b64.charAt((bitmap >> 6) & 63) +
      b64.charAt(bitmap & 63);
  }
  return rest ? result.slice(0, rest - 3) + '==='.substring(rest) : result;
}
/**
 * Base64解码为原始字符串，平替浏览器的atob, 不包含中文的处理（适用于任何环境，包括小程序）
 * @param {string} string
 * @returns {string}
 */
export function weAtob(string: string): string {
  // 同window.atob: Base64解码为原始字符串
  string = String(string).replace(/[\t\n\f\r ]+/g, '');
  if (!b64re.test(string))
    throw new TypeError("Failed to execute 'atob' on 'Window': The string to be decoded is not correctly encoded.");
  string += '=='.slice(2 - (string.length & 3));
  let bitmap,
    result = '',
    r1,
    r2,
    i = 0;
  for (const strLen = string.length; i < strLen; ) {
    bitmap =
      (b64.indexOf(string.charAt(i++)) << 18) |
      (b64.indexOf(string.charAt(i++)) << 12) |
      ((r1 = b64.indexOf(string.charAt(i++))) << 6) |
      (r2 = b64.indexOf(string.charAt(i++)));
    result +=
      r1 === 64
        ? String.fromCharCode((bitmap >> 16) & 255)
        : r2 === 64
        ? String.fromCharCode((bitmap >> 16) & 255, (bitmap >> 8) & 255)
        : String.fromCharCode((bitmap >> 16) & 255, (bitmap >> 8) & 255, bitmap & 255);
  }
  return result;
}

function stringToUint8Array(str) {
  const utf8 = encodeURIComponent(str); // 将字符串转换为 UTF-8 编码
  const uint8Array = new Uint8Array(utf8.length); // 创建 Uint8Array
  for (let i = 0; i < utf8.length; i++) {
    uint8Array[i] = utf8.charCodeAt(i); // 填充 Uint8Array
  }
  return uint8Array;
}
function uint8ArrayToString(uint8Array) {
  const utf8 = String.fromCharCode.apply(null, uint8Array); // 将 Uint8Array 转为字符串
  return decodeURIComponent(utf8); // 将 UTF-8 字符串解码回正常字符串
}
/**
 * 将base64编码的字符串转换为原始字符串，包括对中文内容的处理(高性能，且支持Web、Node、小程序等任意平台)
 * @param base64 base64编码的字符串
 * @returns 原始字符串，包括中文内容
 */
export function b64decode(base64: string): string {
  const binaryString = !isNullOrUnDef(getGlobal('atob')) ? (getGlobal('atob') as any)(base64) : weAtob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  // 使用TextDecoder将Uint8Array转换为原始字符串，包括中文内容
  return !isNullOrUnDef(getGlobal('TextDecoder'))
    ? new (getGlobal('TextDecoder') as any)('utf-8').decode(bytes)
    : uint8ArrayToString(bytes);
}
/**
 * 将原始字符串，包括中文内容，转换为base64编码的字符串(高性能，且支持Web、Node、小程序等任意平台)
 * @param rawStr 原始字符串，包括中文内容
 * @returns base64编码的字符串
 */
export function b64encode(rawStr: string): string {
  const utf8Array = !isNullOrUnDef(getGlobal('TextEncoder'))
    ? new (getGlobal('TextEncoder') as any)().encode(rawStr)
    : stringToUint8Array(rawStr);

  // 将 Uint8Array 转换为二进制字符串
  let binaryString = '';
  const len = utf8Array.length;
  for (let i = 0; i < len; i++) {
    binaryString += String.fromCharCode(utf8Array[i]);
  }
  // 将二进制字符串转换为base64编码的字符串
  return !isNullOrUnDef(getGlobal('btoa')) ? (getGlobal('btoa') as any)(binaryString) : weBtoa(binaryString);
}
