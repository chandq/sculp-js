import { b64decode, b64encode, weAtob, weBtoa } from '../src/base64';
import './utils';

test('weBtoa', () => {
  const str = 'hello, welcome to js world';
  expect(weBtoa(str)).toBe('aGVsbG8sIHdlbGNvbWUgdG8ganMgd29ybGQ=');
});

test('weAtob', () => {
  const str = 'aGVsbG8sIHdlbGNvbWUgdG8ganMgd29ybGQ=';
  expect(weAtob(str)).toBe('hello, welcome to js world');
});

test('b64encode,b64decode', () => {
  const rawStr = '"https://www.runoob.com/"::hello, #1Link-  欢迎来到前端 JS 世界&You like it?';
  const encodeStr = b64encode(rawStr);
  // 新的实现与 Node.js Buffer.from(str, 'utf8').toString('base64') 完全一致
  expect(encodeStr).toBe(
    'Imh0dHBzOi8vd3d3LnJ1bm9vYi5jb20vIjo6aGVsbG8sICMxTGluay0gIOasoui/juadpeWIsOWJjeerryBKUyDkuJbnlYwmWW91IGxpa2UgaXQ/'
  );
  const decodeStr = b64decode(encodeStr);
  expect(decodeStr).toBe(rawStr);
});

test('b64encode,b64decode 处理各种特殊字符', () => {
  const testCases = [
    '你好，世界',
    'こんにちは世界',
    '안녕하세요 세계',
    '🚀🌟💻',
    'Mixed: 你好 hello 世界 world 🚀',
    'Special: \n\t\r\n  spaces   and tabs\t',
    'Emoji: 😀😃😁😆😍🤔🙄😴💤💩👻🎃🎄',
    '' // 空字符串
  ];

  testCases.forEach(testStr => {
    const encoded = b64encode(testStr);
    const decoded = b64decode(encoded);
    expect(decoded).toBe(testStr);
  });
});

test('b64encode,b64decode 处理大数据', () => {
  const largeStr = '你好世界！Hello World!'.repeat(1000);
  const encoded = b64encode(largeStr);
  const decoded = b64decode(encoded);
  expect(decoded).toBe(largeStr);
});

test('b64encode,b64decode 与 Node.js Buffer 兼容', () => {
  const testStrs = ['Hello World', '你好世界', '🎉🎊', 'Mixed: 你好 hello 🚀'];

  testStrs.forEach(testStr => {
    const encoded = b64encode(testStr);
    // 验证与 Node.js Buffer 编码一致
    const expectedEncoded = Buffer.from(testStr, 'utf8').toString('base64');
    expect(encoded).toBe(expectedEncoded);

    const decoded = b64decode(encoded);
    // 验证与 Node.js Buffer 解码一致
    const expectedDecoded = Buffer.from(encoded, 'base64').toString('utf8');
    expect(decoded).toBe(expectedDecoded);
  });
});
