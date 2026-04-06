import { getGlobal } from './func';
import { isNullOrUnDef } from './type';

const b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
// eslint-disable-next-line
const b64re = /^(?:[A-Za-z\d+\/]{4})*?(?:[A-Za-z\d+\/]{2}(?:==)?|[A-Za-z\d+\/]{3}=?)?$/;

/**
 * 高性能 UTF-8 字符串转 Uint8Array
 */
function stringToUint8Array(str: string): Uint8Array {
  const len = str.length;
  const bytes = new Uint8Array(len * 3); // 最多 3 倍长度
  let j = 0;

  for (let i = 0; i < len; i++) {
    let code = str.charCodeAt(i);

    if (code < 0x80) {
      bytes[j++] = code;
    } else if (code < 0x800) {
      bytes[j++] = 0xc0 | (code >> 6);
      bytes[j++] = 0x80 | (code & 0x3f);
    } else if (code < 0xd800 || code >= 0xe000) {
      bytes[j++] = 0xe0 | (code >> 12);
      bytes[j++] = 0x80 | ((code >> 6) & 0x3f);
      bytes[j++] = 0x80 | (code & 0x3f);
    } else {
      // 处理代理对（emoji 等）
      i++;
      code = 0x10000 + (((code & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      bytes[j++] = 0xf0 | (code >> 18);
      bytes[j++] = 0x80 | ((code >> 12) & 0x3f);
      bytes[j++] = 0x80 | ((code >> 6) & 0x3f);
      bytes[j++] = 0x80 | (code & 0x3f);
    }
  }

  return bytes.subarray(0, j);
}

/**
 * 高性能 Uint8Array 转 UTF-8 字符串
 */
function uint8ArrayToString(bytes: Uint8Array): string {
  const len = bytes.length;
  let result = '';
  let i = 0;

  while (i < len) {
    const byte1 = bytes[i++];

    if (byte1 < 0x80) {
      result += String.fromCharCode(byte1);
    } else if (byte1 < 0xe0) {
      const byte2 = bytes[i++] & 0x3f;
      result += String.fromCharCode(((byte1 & 0x1f) << 6) | byte2);
    } else if (byte1 < 0xf0) {
      const byte2 = bytes[i++] & 0x3f;
      const byte3 = bytes[i++] & 0x3f;
      result += String.fromCharCode(((byte1 & 0x0f) << 12) | (byte2 << 6) | byte3);
    } else {
      const byte2 = bytes[i++] & 0x3f;
      const byte3 = bytes[i++] & 0x3f;
      const byte4 = bytes[i++] & 0x3f;
      let code = ((byte1 & 0x07) << 18) | (byte2 << 12) | (byte3 << 6) | byte4;
      code -= 0x10000;
      result += String.fromCharCode(0xd800 + ((code >> 10) & 0x3ff), 0xdc00 + (code & 0x3ff));
    }
  }

  return result;
}

/**
 * 高性能 Base64 编码（二进制字符串转 Base64）
 */
function binaryToBase64(binary: string): string {
  const len = binary.length;
  let result = '';
  let i = 0;

  for (; i < len - 2; i += 3) {
    const n = (binary.charCodeAt(i) << 16) | (binary.charCodeAt(i + 1) << 8) | binary.charCodeAt(i + 2);
    result += b64.charAt(n >> 18) + b64.charAt((n >> 12) & 0x3f) + b64.charAt((n >> 6) & 0x3f) + b64.charAt(n & 0x3f);
  }

  // 处理剩余字节
  const remaining = len - i;
  if (remaining === 1) {
    const n = binary.charCodeAt(i);
    result += b64.charAt(n >> 2) + b64.charAt((n << 4) & 0x3f) + '==';
  } else if (remaining === 2) {
    const n = (binary.charCodeAt(i) << 8) | binary.charCodeAt(i + 1);
    result += b64.charAt(n >> 10) + b64.charAt((n >> 4) & 0x3f) + b64.charAt((n << 2) & 0x3f) + '=';
  }

  return result;
}

/**
 * 高性能 Base64 解码（Base64 转二进制字符串）
 */
function base64ToBinary(base64Str: string): string {
  base64Str = String(base64Str).replace(/[\t\n\f\r ]+/g, '');

  if (!b64re.test(base64Str)) {
    throw new TypeError("Failed to execute 'atob' on 'Window': The string to be decoded is not correctly encoded.");
  }

  const len = base64Str.length;
  const padding = base64Str.endsWith('==') ? 2 : base64Str.endsWith('=') ? 1 : 0;
  const result = new Array(len * 0.75 - padding);
  let j = 0;

  for (let i = 0; i < len; i += 4) {
    const n =
      (b64.indexOf(base64Str.charAt(i)) << 18) |
      (b64.indexOf(base64Str.charAt(i + 1)) << 12) |
      ((b64.indexOf(base64Str.charAt(i + 2)) & 0x3f) << 6) |
      (b64.indexOf(base64Str.charAt(i + 3)) & 0x3f);

    result[j++] = String.fromCharCode((n >> 16) & 0xff);
    if (i + 2 < len - padding || padding < 2) {
      result[j++] = String.fromCharCode((n >> 8) & 0xff);
    }
    if (i + 3 < len - padding || padding < 1) {
      result[j++] = String.fromCharCode(n & 0xff);
    }
  }

  return result.join('');
}

/**
 * 字符串编码成 Base64（适用于任何环境，包括小程序）
 * @param {string} string
 * @returns {string}
 */
export function weBtoa(string: string): string {
  string = String(string);
  const len = string.length;

  for (let i = 0; i < len; i++) {
    if (string.charCodeAt(i) > 255) {
      throw new TypeError(
        "Failed to execute 'btoa' on 'Window': The string to be encoded contains characters outside of the Latin1 range."
      );
    }
  }

  return binaryToBase64(string);
}

/**
 * Base64 解码为原始字符串（适用于任何环境，包括小程序）
 * @param {string} string
 * @returns {string}
 */
export function weAtob(string: string): string {
  return base64ToBinary(string);
}
/**
 * 将 base64 编码的字符串转换为原始字符串，包括对中文内容的处理 (高性能，且支持 Web、Node、小程序等任意平台)
 * @param base64 base64 编码的字符串
 * @returns 原始字符串，包括中文内容
 */
export function b64decode(base64: string): string {
  // 优先使用原生方法（性能最优）
  if (!isNullOrUnDef(getGlobal('atob')) && !isNullOrUnDef(getGlobal('TextDecoder'))) {
    try {
      const binaryString = (getGlobal('atob') as any)(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new (getGlobal('TextDecoder') as any)('utf-8').decode(bytes);
    } catch (e) {
      // 如果原生方法失败，使用降级方案
    }
  }

  // 降级方案：使用自定义实现
  const binaryString = base64ToBinary(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return uint8ArrayToString(bytes);
}

/**
 * 将原始字符串，包括中文内容，转换为 base64 编码的字符串 (高性能，且支持 Web、Node、小程序等任意平台)
 * @param rawStr 原始字符串，包括中文内容
 * @returns base64 编码的字符串
 */
export function b64encode(rawStr: string): string {
  // 优先使用原生方法（性能最优）
  if (!isNullOrUnDef(getGlobal('btoa')) && !isNullOrUnDef(getGlobal('TextEncoder'))) {
    try {
      const utf8Array = new (getGlobal('TextEncoder') as any)().encode(rawStr);
      let binaryString = '';
      const len = utf8Array.length;
      for (let i = 0; i < len; i++) {
        binaryString += String.fromCharCode(utf8Array[i]);
      }
      return (getGlobal('btoa') as any)(binaryString);
    } catch (e) {
      // 如果原生方法失败，使用降级方案
    }
  }

  // 降级方案：使用自定义实现
  const utf8Array = stringToUint8Array(rawStr);

  // 将 Uint8Array 转换为二进制字符串
  let binaryString = '';
  const len = utf8Array.length;
  for (let i = 0; i < len; i++) {
    binaryString += String.fromCharCode(utf8Array[i]);
  }

  // 将二进制字符串转换为 base64 编码
  return binaryToBase64(binaryString);
}

export default {
  weBtoa,
  weAtob,
  b64decode,
  b64encode
};
