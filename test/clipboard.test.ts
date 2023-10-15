import { copyText } from '../src/clipboard';

test('copyText', () => {
  expect(copyText('123')).toBe(undefined);
});
