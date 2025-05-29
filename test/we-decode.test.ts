import { weAtob, weBtoa } from '../src/we-decode';
import './utils';

test('weBtoa', () => {
  const str = 'hello, welcome to js world';
  expect(weBtoa(str)).toBe('aGVsbG8sIHdlbGNvbWUgdG8ganMgd29ybGQ=');
});

test('weAtob', () => {
  const str = 'aGVsbG8sIHdlbGNvbWUgdG8ganMgd29ybGQ=';
  expect(weAtob(str)).toBe('hello, welcome to js world');
});
