import { UnicodeToolkit } from '../src/unicodeToolkit';

describe('UnicodeToolkit 核心功能测试', () => {
  const EMOJI = '🚀'; // CodePoint: 128640, UTF-16: \uD83D\uDE80
  const CHINESE = '文';

  describe('encode 方法', () => {
    it('应正确执行 Unicode 编码', () => {
      expect(UnicodeToolkit.encode('A')).toBe('A');
      expect(UnicodeToolkit.encode(CHINESE)).toBe('\\u6587');
      // 处理超出 0xFFFF 的字符
      expect(UnicodeToolkit.encode(EMOJI)).toBe('\\u{1F680}');
    });

    it('应正确执行 HTML 实体编码', () => {
      expect(UnicodeToolkit.encode('<script>', 'html')).toBe('&lt;script&gt;');
      expect(UnicodeToolkit.encode(EMOJI, 'html')).toBe('&#128640;');
    });
  });

  describe('decode 方法', () => {
    it('应能解码混合模式字符串', () => {
      const mixed = 'A \\u6587 &#128640; &lt;';
      expect(UnicodeToolkit.decode(mixed)).toBe('A 文 🚀 <');
    });

    it('应能解码 ES6 风格大括号 Unicode', () => {
      expect(UnicodeToolkit.decode('\\u{1F680}')).toBe(EMOJI);
    });
  });

  // describe('高性能 UTF-8', () => {
  //   it('toUTF8 应生成正确的字节序列', () => {
  //     const bytes = UnicodeToolkit.toUTF8('A');
  //     expect(bytes[0]).toBe(65);
  //     expect(UnicodeToolkit.toUTF8(CHINESE).length).toBe(3); // 中文通常占 3 字节
  //   });
  // });
});
