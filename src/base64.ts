import { getGlobal } from './func';
import { isNullOrUnDef } from './type';
import { weAtob, weBtoa } from './we-decode';

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
export function decodeFromBase64(base64: string): string {
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
export function encodeToBase64(rawStr: string): string {
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
