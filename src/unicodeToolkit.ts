/**
 * 增强型 Unicode/HTML/UTF-8 编码解码工具
 */
export class UnicodeToolkit {
  // 基础 HTML 实体映射
  private static readonly ENTITY_MAP: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };

  private static readonly NAMED_ENTITIES: Record<string, string> = {
    '&quot;': '"',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&nbsp;': '\u00A0',
    '&copy;': '©',
    '&trade;': '™',
    '&reg;': '®'
  };

  /**
   * 编码函数
   * @param {string} str 原始字符串
   * @param {'unicode'|'html'} mode 'unicode' (\uXXXX) | 'html' (&#123;) | 'entities' (命名实体)
   * @param {boolean} encodeAll 是否编码 ASCII 可见字符 (默认 false，仅编码非 ASCII 和特殊字符)
   * @returns {string} 编码后的字符串
   * @example
   * // Unicode 编码 (默认仅编码非 ASCII)
   * UnicodeToolkit.encode('Hi 你好 😀')
   * // => 'Hi \u4F60\u597D \u{1F600}'
   * @example
   * // 全部 Unicode 编码
   * UnicodeToolkit.encode('Hi 你好 😀','unicode', true)
   * // => '\u0048\u0069\u0020\u4F60\u597D\u0020\u{1F600}'
   * @example
   * // HTML 实体编码
   * UnicodeToolkit.encode('<scr' + 'ipt>', 'html',true)
   * // => '&lt;&#115;&#99;&#114;&#105;&#112;&#116;&gt;&amp;'
   */
  static encode(str: string, mode: 'unicode' | 'html' = 'unicode', encodeAll = false): string {
    const result: string[] = [];

    for (const char of str) {
      const codePoint = char.codePointAt(0)!;

      // 1. 处理特殊 HTML 基础字符
      if (mode === 'html' && this.ENTITY_MAP[char]) {
        result.push(this.ENTITY_MAP[char]);
        continue;
      }

      // 2. ASCII 范围 (32-126) 且不强制全编码时，保持原样
      if (!encodeAll && codePoint >= 32 && codePoint <= 126) {
        result.push(char);
        continue;
      }

      // 3. 根据模式转换
      if (mode === 'unicode') {
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
   * 综合解码 (支持 \uXXXX, \u{XXXX}, HTML 实体, 十六进制实体)
   * @param {boolean} normalizeSpace 是否将 \u00A0 (&nbsp;) 转换为普通空格 \u0020
   * @returns {string} 解码后的字符串
   *
   * @example
   * // 解码 Unicode 和 Emoji
   * UnicodeToolkit.decode('\u4F60\u597D\u{1F680}')
   * // => '你好🚀'
   * @example
   * // 解码 HTML 实体 (支持十进制、十六进制和命名实体)
   * UnicodeToolkit.decode('Price: &#163;10 &amp; &copy;')
   * // => 'Price: £10 & ©'
   * @example
   * // 空格归一化 (将 &nbsp; 转为标准空格)
   * UnicodeToolkit.decode('A&nbsp;B', true)
   * // => 'A B' (charCodeAt 为 32 而不是 160)
   */
  static decode(str: string, normalizeSpace = false): string {
    if (!str) return '';

    let decoded = str
      // 1. Unicode: \uXXXX 和 \u{XXXX}
      .replace(/\\u(?:\{([0-9a-fA-F]+)\}|([0-9a-fA-F]{4}))/g, (_, hexLong, hexShort) => {
        return String.fromCodePoint(parseInt(hexLong || hexShort, 16));
      })
      // 2. HTML 实体: &#123; 和 &#x7B;
      .replace(/&#(x?)([0-9a-fA-F]+);/g, (_, isHex, code) => {
        return String.fromCodePoint(parseInt(code, isHex ? 16 : 10));
      })
      // 3. 命名实体
      .replace(/&[a-z0-9]+;/gi, entity => {
        return this.NAMED_ENTITIES[entity] || entity;
      });

    // 4. 空格归一化处理
    if (normalizeSpace) {
      // 将 \u00A0 替换为标准半角空格 \u0020
      decoded = decoded.replace(/\u00A0/g, ' ');
    }

    return decoded;
  }
}

export default {
  UnicodeToolkit
};
