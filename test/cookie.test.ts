import { cookieGet, cookieSet, cookieDel } from '../src/cookie';

test('all', () => {
  const randomKey = `${Math.random()}`;
  const randomVal = `${Math.random()}`;
  expect(cookieGet(randomKey)).toBe('');
  cookieSet(randomKey, randomVal);
  cookieSet('key1', 'randomVal', new Date());
  expect(cookieGet(randomKey)).toBe(randomVal);
  expect(cookieGet('otherKey')).toBe('');
  cookieDel(randomKey);
  expect(cookieGet(randomKey)).toBe('');
});
