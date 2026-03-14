import { UnicodeToolkit } from '../src/unicodeToolkit';

describe('UnicodeToolkit', () => {
  describe('encode - unicode mode', () => {
    it('should encode basic ASCII characters', () => {
      const result = UnicodeToolkit.encode('Hello', 'unicode', true);
      expect(result).toBe('\\u0048\\u0065\\u006C\\u006C\\u006F');
    });

    it('should encode special characters', () => {
      const result = UnicodeToolkit.encode('&<>"', 'unicode', true);
      expect(result).toBe('\\u0026\\u003C\\u003E\\u0022');
    });

    it('should encode Chinese characters', () => {
      const result = UnicodeToolkit.encode('你好');
      expect(result).toBe('\\u4F60\\u597D');
    });

    it('should encode Emoji (surrogate pairs)', () => {
      const result = UnicodeToolkit.encode('😀');
      expect(result).toBe('\\u{1F600}');
    });

    it('should encode mixed content', () => {
      // console.log(UnicodeToolkit.encode('Hi 你好😀', 'unicode', true));
      // console.log(UnicodeToolkit.decode('Hi \\u4F60\\u597D\\u{1F600}'));
      // console.log(UnicodeToolkit.decode('\\u0048\\u0069\\u0020\\u4F60\\u597D\\u{1F600}'));
      const result = UnicodeToolkit.encode('Hi 你好😀', 'unicode', true);
      // const result2 = UnicodeToolkit.encode('Hi 你好 😀', 'unicode');
      // const result3 = UnicodeToolkit.encode('Hi 你好 😀', 'unicode', true);
      // console.log('result2', UnicodeToolkit.decode('\\u4F60\\u597D\\u{1F680}'));
      expect(result).toBe('\\u0048\\u0069\\u0020\\u4F60\\u597D\\u{1F600}');
      expect(UnicodeToolkit.decode('\\u4F60\\u597D\\u{1F680}')).toBe('你好🚀');
      expect(UnicodeToolkit.decode('Price: &#163;10 &amp; &copy;')).toBe('Price: £10 & ©');
      expect(UnicodeToolkit.decode('A&nbsp;B', true)).toBe('A B');
    });

    it('should handle empty string', () => {
      const result = UnicodeToolkit.encode('');
      expect(result).toBe('');
    });
  });

  describe('encode - html mode', () => {
    it('should encode special HTML entities', () => {
      const result = UnicodeToolkit.encode('&<>"', 'html');
      expect(result).toBe('&amp;&lt;&gt;&quot;');
    });

    it('should encode non-breaking space', () => {
      const result = UnicodeToolkit.encode('\u00A0', 'html');
      expect(result).toBe('&#160;');
    });

    it('should encode copyright symbol', () => {
      const result = UnicodeToolkit.encode('©', 'html');
      expect(result).toBe('&#169;');
    });

    it('should encode Chinese characters as numeric entities', () => {
      const result = UnicodeToolkit.encode('你好', 'html');
      expect(result).toBe('&#20320;&#22909;');
    });

    it('should encode Emoji as numeric entities', () => {
      const result = UnicodeToolkit.encode('😀', 'html');
      expect(result).toBe('&#128512;');
    });

    it('should handle empty string', () => {
      const result = UnicodeToolkit.encode('', 'html');
      expect(result).toBe('');
    });
  });

  describe('decode', () => {
    it('should decode standard \\uXXXX format', () => {
      const result = UnicodeToolkit.decode('\\u0048\\u0065\\u006C\\u006C\\u006F');
      expect(result).toBe('Hello');
    });

    it('should decode ES6 \\u{XXXX} format', () => {
      const result = UnicodeToolkit.decode('\\u{1F600}');
      expect(result).toBe('😀');
    });

    it('should decode HTML numeric entities (decimal)', () => {
      const result = UnicodeToolkit.decode('&#20320;&#22909;');
      expect(result).toBe('你好');
    });

    it('should decode HTML numeric entities (hexadecimal)', () => {
      const result = UnicodeToolkit.decode('&#x4F60;&#x597D;');
      expect(result).toBe('你好');
    });

    it('should decode named HTML entities', () => {
      const result = UnicodeToolkit.decode('&amp;&lt;&gt;&quot;&nbsp;&copy;');
      const result2 = UnicodeToolkit.decode('&amp;&lt;&gt;&quot;&nbsp;&copy;', true);
      expect(result).toBe('&<>"\u00A0©');
      expect(result2).toBe('&<>" ©');
    });

    it('should decode mixed encoding formats', () => {
      const result = UnicodeToolkit.decode('\\u0048&#105;&#x6C;&#108;&#111;');
      expect(result).toBe('Hillo');
    });

    it('should handle empty string', () => {
      const result = UnicodeToolkit.decode('');
      expect(result).toBe('');
    });

    it('should handle invalid entities gracefully', () => {
      const result = UnicodeToolkit.decode('Hello &invalid; World');
      expect(result).toBe('Hello &invalid; World');
    });
  });

  describe('encode and decode roundtrip', () => {
    it('should roundtrip ASCII characters', () => {
      const original = 'Hello World!';
      const encoded = UnicodeToolkit.encode(original);
      const decoded = UnicodeToolkit.decode(encoded);
      expect(decoded).toBe(original);
    });

    it('should roundtrip Chinese characters', () => {
      const original = '你好世界';
      const encoded = UnicodeToolkit.encode(original);
      const decoded = UnicodeToolkit.decode(encoded);
      expect(decoded).toBe(original);
    });

    it('should roundtrip Emoji', () => {
      const original = '😀😁😂';
      const encoded = UnicodeToolkit.encode(original);
      const decoded = UnicodeToolkit.decode(encoded);
      expect(decoded).toBe(original);
    });

    it('should roundtrip mixed content', () => {
      const original = 'Hello 你好😀 &<>"';
      const encoded = UnicodeToolkit.encode(original);
      const decoded = UnicodeToolkit.decode(encoded);
      expect(decoded).toBe(original);
    });

    it('should roundtrip with HTML mode', () => {
      const original = 'Hello &<>"';
      const encoded = UnicodeToolkit.encode(original, 'html');
      const decoded = UnicodeToolkit.decode(encoded);
      expect(decoded).toBe(original);
    });
  });

  // describe('toUTF8', () => {
  //   it('should encode ASCII to UTF-8 bytes', () => {
  //     const result = UnicodeToolkit.toUTF8('Hello');
  //     expect(result).toBeInstanceOf(Uint8Array);
  //     expect(result.length).toBe(5);
  //     expect(result[0]).toBe(0x48); // 'H'
  //   });

  //   it('should encode Chinese to UTF-8 bytes', () => {
  //     const result = UnicodeToolkit.toUTF8('你好');
  //     expect(result).toBeInstanceOf(Uint8Array);
  //     expect(result.length).toBe(6); // 3 bytes per Chinese character
  //   });

  //   it('should encode Emoji to UTF-8 bytes', () => {
  //     const result = UnicodeToolkit.toUTF8('😀');
  //     expect(result).toBeInstanceOf(Uint8Array);
  //     expect(result.length).toBe(4); // 4 bytes for Emoji
  //   });

  //   it('should handle empty string', () => {
  //     const result = UnicodeToolkit.toUTF8('');
  //     expect(result).toBeInstanceOf(Uint8Array);
  //     expect(result.length).toBe(0);
  //   });

  //   it('should produce correct UTF-8 byte sequence', () => {
  //     const result = UnicodeToolkit.toUTF8('A');
  //     expect(result[0]).toBe(0x41);
  //   });
  // });
});

// import { UnicodeToolkit } from './UnicodeToolkit';

describe('UnicodeToolkit 综合测试', () => {
  describe('encode 方法', () => {
    test('应正确编码 Emoji (代理对)', () => {
      const input = '🚀';
      expect(UnicodeToolkit.encode(input, 'unicode')).toBe('\\u{1F680}');
      expect(UnicodeToolkit.encode(input, 'html')).toBe('&#128640;');
    });

    test('应处理混合文本（仅编码非 ASCII）', () => {
      const input = 'Hello 你好';
      // 'Hello ' 保持原样，'你好' 被编码
      expect(UnicodeToolkit.encode(input, 'unicode')).toBe('Hello \\u4F60\\u597D');
    });

    test('HTML 模式下应转义特殊符号', () => {
      const input = '<script>&';
      expect(UnicodeToolkit.encode(input, 'html')).toBe('&lt;script&gt;&amp;');
      expect(UnicodeToolkit.encode(input, 'html', true)).toBe('&lt;&#115;&#99;&#114;&#105;&#112;&#116;&gt;&amp;');
    });
  });

  describe('decode 方法', () => {
    test('应解析各种 Unicode 格式', () => {
      const input = '\\u4F60\\u{1F600}';
      expect(UnicodeToolkit.decode(input)).toBe('你😀');
    });

    test('应解析 HTML 十进制和十六进制实体', () => {
      const input = '&#20013;&#x56FD;';
      expect(UnicodeToolkit.decode(input)).toBe('中国');
    });

    test('应解析 HTML 命名实体', () => {
      const input = '&lt;b&gt;Text&nbsp;&copy;&quot;';
      expect(UnicodeToolkit.decode(input)).toBe('<b>Text\u00A0©"');
    });

    test('处理错误格式时不应崩溃', () => {
      const input = 'Normal text \\u123 (invalid)';
      expect(UnicodeToolkit.decode(input)).toBe(input);
    });
  });

  // describe('UTF-8 转换', () => {
  //   test('Uint8Array 与字符串互转', () => {
  //     const input = 'UTF-8 数据: ⚡';
  //     const encoded = UnicodeToolkit.toUTF8(input);
  //     expect(encoded).toBeInstanceOf(Uint8Array);
  //     expect(UnicodeToolkit.fromUTF8(encoded)).toBe(input);
  //   });
  // });

  describe('极端边界测试', () => {
    test('处理空字符串', () => {
      expect(UnicodeToolkit.encode('')).toBe('');
      expect(UnicodeToolkit.decode('')).toBe('');
    });

    test('处理大量重复数据', () => {
      const longStr = 'A'.repeat(1000) + '测'.repeat(1000);
      const encoded = UnicodeToolkit.encode(longStr, 'unicode');
      expect(UnicodeToolkit.decode(encoded)).toBe(longStr);
    });
  });
});
