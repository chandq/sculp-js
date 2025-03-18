import { escapeRegExp, executeInScope, parseVarFromString, replaceVarFromString, uniqueSymbol } from '../src/variable';

test('uniqueSymbol', () => {
  const res = uniqueSymbol('1a1bac');
  expect(res).toBe('1abc');
});
test('escapeRegExp', () => {
  const res = escapeRegExp('abc${');
  expect(res).toBe('abc\\$\\{');
});
test('parseVarFromString', () => {
  const rawStr1 = 'http://www.baidu.com/?id={id}&name={name}';
  const rawStr2 = 'http://www.baidu.com/${{subdomain}}/as#project=${{project}}?id=${{ id}}&name=${{ name }}';
  expect(parseVarFromString(rawStr1)).toStrictEqual(['id', 'name']);
  expect(parseVarFromString(rawStr2, '${{', '}}')).toStrictEqual(['subdomain', 'project', 'id', 'name']);
});
test('replaceVarFromString', () => {
  const rawStr1 = 'http://www.baidu.com/?id={id}&name={name}';
  const rawStr2 = 'http://www.baidu.com/${{subdomain}}/as#project=${{project}}?id=${{ id}}&name=${{ name }}';
  expect(
    replaceVarFromString(rawStr1, {
      id: 123,
      name: 'test'
    })
  ).toBe('http://www.baidu.com/?id=123&name=test');
  expect(
    replaceVarFromString(
      rawStr2,
      {
        id: 123,
        name: 'test',
        subdomain: 'mall',
        project: 'proj-demo'
      },
      '${{',
      '}}'
    )
  ).toBe('http://www.baidu.com/mall/as#project=proj-demo?id=123&name=test');
});
test('escapeRegExp', () => {
  // 测试用例 1: 基本变量访问
  const scope1 = { a: 1, b: 2 };
  const result1 = executeInScope('return a + b;', scope1);
  expect(result1).toBe(3);

  // 测试用例 2: 变量不存在时抛出错误
  const scope2 = { a: 1 };
  expect(() => {
    executeInScope('return a + b;', scope2);
  }).toThrow('代码执行失败: b is not defined');

  // 测试用例 3: 修改对象属性（按引用传递）
  const scope3 = { obj: { value: 10 } };
  executeInScope('obj.value = 20;', scope3);
  expect(scope3.obj.value).toBe(20);

  // 测试用例 4: 函数内部变量不影响外部作用域
  const scope4 = { x: 5 };
  executeInScope('let y = 10; x = y;', scope4);
  expect(scope4.x).toBe(5);

  // 测试用例 5: 支持复杂表达式和运算
  const scope5 = { base: 100 };
  const result5 = executeInScope('return Array.from({ length: 3 }, (_, i) => base + i);', scope5);
  expect(result5).toStrictEqual([100, 101, 102]);

  // 测试用例 6: 支持外传函数执行
  const scope6 = {
    $: {
      fun: {
        time: {
          getFullYear: function (date: any = null) {
            if (date === null || date === undefined) {
              date = new Date();
            }

            return date.getFullYear();
          }
        }
      }
    }
  };
  const result6 = executeInScope('return $.fun.time.getFullYear(new Date("2025"))', scope6);
  expect(result6).toBe(2025);
});
