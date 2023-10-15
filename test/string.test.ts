import {
  stringAssign,
  stringCamelCase,
  stringFormat,
  stringKebabCase,
  STRING_ARABIC_NUMERALS,
  STRING_LOWERCASE_ALPHA,
  STRING_UPPERCASE_ALPHA,
  stringEscapeHtml,
  stringFill
} from '../src/string';

test('stringCamelCase', () => {
  expect(stringCamelCase('hello-world')).toBe('helloWorld');
  expect(stringCamelCase('hello_world')).toBe('helloWorld');

  expect(stringCamelCase('hello-world', true)).toBe('HelloWorld');
  expect(stringCamelCase('hello_world', true)).toBe('HelloWorld');
});

test('kebabCase', () => {
  expect(stringKebabCase('helloWorld')).toBe('hello-world');
  expect(stringKebabCase('HelloWorld')).toBe('hello-world');
  expect(stringKebabCase('helloWorld', '_')).toBe('hello_world');
  expect(stringKebabCase('HelloWorld', '_')).toBe('hello_world');
});

test('const', () => {
  expect(STRING_ARABIC_NUMERALS).toBe('0123456789');
  expect(STRING_LOWERCASE_ALPHA).toBe('abcdefghijklmnopqrstuvwxyz');
  expect(STRING_UPPERCASE_ALPHA).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
});

test('stringFormat', () => {
  expect(stringFormat('%s是个字符串', 1)).toBe('1是个字符串');
  expect(stringFormat('%s是个数值', 1)).toBe('1是个数值');
  expect(stringFormat('%o是个对象', { a: 1 })).toBe('{"a":1}是个对象');
  expect(stringFormat('%%是个百分号', '确定')).toBe('%是个百分号 确定');
  expect(stringFormat('[%d/%d]: 第 %d 步要%s，当前进度%%%d', 1, 10, 1, '吃饭', 50, '未完成')).toBe(
    '[1/10]: 第 1 步要吃饭，当前进度%50 未完成'
  );
});

test('stringAssign', () => {
  const data = {
    username: '张三',
    foods: ['饭', '菜'],
    foo: {
      bars: [
        {
          ttt: '唱歌'
        }
      ]
    }
  };
  const template = '${username}会吃${foods[0]}，也会吃${foods[1]}，平时喜欢${foo.bars[0].ttt}';

  expect(stringAssign(template, data)).toBe('张三会吃饭，也会吃菜，平时喜欢唱歌');
  expect(() => {
    stringAssign('${xx.xx}', data);
  }).toThrow('无法执行');
});

test('stringEscapeHtml', () => {
  expect(stringEscapeHtml('<h>&"')).toEqual('&lt;h&gt;&amp;&quot;');
});

test('stringFill', () => {
  expect(stringFill(5)).toEqual('     ');
  expect(stringFill(5, '1')).toEqual('11111');
});
