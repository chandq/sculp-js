/**
 * 高效 Unicode/HTML/UTF-8 编码解码工具
 */
export class UnicodeToolkit {
  private static readonly ENTITY_REV_MAP: Record<string, string> = {
    '"': '&quot;',
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '\u00A0': '&nbsp;',
    '©': '&copy;'
  };

  /**
   * 1. 综合编码方法
   * @param mode 'unicode' (转义为 \uXXXX) | 'html' (转义为 &#...;)
   */
  static encode(str: string, mode: 'unicode' | 'html' = 'unicode'): string {
    const result: string[] = [];

    // 使用 for...of 正确处理代理对（Emoji）
    for (const char of str) {
      const codePoint = char.codePointAt(0)!;

      // ASCII 范围内字符不编码（除了 HTML 必需的特殊字符）
      if (codePoint <= 127) {
        if (mode === 'html' && this.ENTITY_REV_MAP[char]) {
          result.push(this.ENTITY_REV_MAP[char]);
        } else {
          result.push(char);
        }
        continue;
      }

      // 处理非 ASCII 字符
      if (mode === 'unicode') {
        // 如果码点超过 0xFFFF，说明是代理对，转义为 \u{XXXXXX} 或拆分为两个 \uXXXX
        if (codePoint > 0xffff) {
          result.push(`\\u{${codePoint.toString(16).toUpperCase()}}`);
        } else {
          result.push(`\\u${codePoint.toString(16).toUpperCase().padStart(4, '0')}`);
        }
      } else {
        result.push(`&#${codePoint};`);
      }
    }
    return result.join('');
  }

  /**
   * 2. 混合解码 (支持 \uXXXX, \u{XXXX}, HTML 实体)
   */
  static decode(str: string): string {
    return (
      str
        // 处理 \u{XXXX} 这种 ES6 风格编码
        .replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
        // 处理标准 \uXXXX
        .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
        // 处理 HTML 实体
        .replace(/&#(x?)([0-9a-fA-F]+);/g, (_, isHex, code) => String.fromCodePoint(parseInt(code, isHex ? 16 : 10)))
        .replace(/&[a-z]+;/g, e => Object.entries(this.ENTITY_REV_MAP).find(x => x[1] === e)?.[0] || e)
    );
  }

  /**
   * 3. 高性能 UTF-8 转码
   */
  static toUTF8(str: string): Uint8Array {
    return new TextEncoder().encode(str);
  }
}
