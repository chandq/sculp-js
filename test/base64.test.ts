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
  const rawStr = '"https://www.runoob.com/"::hello, #1Link-  欢迎来到前端JS世界&You like it?';
  const encodeStr = b64encode(rawStr);
  expect(encodeStr).toBe(
    'JTIyaHR0cHMlM0ElMkYlMkZ3d3cucnVub29iLmNvbSUyRiUyMiUzQSUzQWhlbGxvJTJDJTIwJTIzMUxpbmstJTIwJTIwJUU2JUFDJUEyJUU4JUJGJThFJUU2JTlEJUE1JUU1JTg4JUIwJUU1JTg5JThEJUU3JUFCJUFGSlMlRTQlQjglOTYlRTclOTUlOEMlMjZZb3UlMjBsaWtlJTIwaXQlM0Y='
  );
  const decodeStr = b64decode(encodeStr);
  expect(decodeStr).toBe(rawStr);
});
