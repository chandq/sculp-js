import { decodeFromBase64, encodeToBase64 } from '../src/base64';

test('encodeToBase64,decodeFromBase64', () => {
  const rawStr = 'hello, #1Link-  欢迎来到前端JS世界&You like it?';
  const encodeStr = encodeToBase64(rawStr);
  expect(encodeStr).toBe(
    'aGVsbG8lMkMlMjAlMjMxTGluay0lMjAlMjAlRTYlQUMlQTIlRTglQkYlOEUlRTYlOUQlQTUlRTUlODglQjAlRTUlODklOEQlRTclQUIlQUZKUyVFNCVCOCU5NiVFNyU5NSU4QyUyNllvdSUyMGxpa2UlMjBpdCUzRg=='
  );
  const decodeStr = decodeFromBase64(encodeStr);
  expect(decodeStr).toBe(rawStr);
});
