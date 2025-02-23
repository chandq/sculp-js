import { decodeFromBase64, encodeToBase64 } from '../src/base64';

test('encodeToBase64,decodeFromBase64', () => {
  const rawStr = '"https://www.runoob.com/"::hello, #1Link-  欢迎来到前端JS世界&You like it?';
  const encodeStr = encodeToBase64(rawStr);
  expect(encodeStr).toBe(
    'JTIyaHR0cHMlM0ElMkYlMkZ3d3cucnVub29iLmNvbSUyRiUyMiUzQSUzQWhlbGxvJTJDJTIwJTIzMUxpbmstJTIwJTIwJUU2JUFDJUEyJUU4JUJGJThFJUU2JTlEJUE1JUU1JTg4JUIwJUU1JTg5JThEJUU3JUFCJUFGSlMlRTQlQjglOTYlRTclOTUlOEMlMjZZb3UlMjBsaWtlJTIwaXQlM0Y='
  );
  const decodeStr = decodeFromBase64(encodeStr);
  expect(decodeStr).toBe(rawStr);
});
