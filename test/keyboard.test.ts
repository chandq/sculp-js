import { wait } from '../src/async';
import { objectEach, objectMerge } from '../src/object';
import Keyboard, {
  getKeyCodeByName,
  getKeyNamesByCode,
  isChrome,
  isFirefox,
  isMac,
  isOpera,
  isSafari
} from '../src/keyboard';

interface KeyProperties {
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  keyCode: number;
}

const simulateKeyboardEvent = (keyName: string, properties?: Partial<KeyProperties>): void => {
  const ev = new KeyboardEvent('keydown');
  const keyCode = getKeyCodeByName(keyName);
  const props = objectMerge<KeyProperties>({ keyCode }, properties);

  objectEach(props, (val, key) => Object.defineProperty(ev, key, { get: () => val }));
  document.dispatchEvent(ev);
};

test('静态函数与属性', () => {
  expect(typeof isMac).toEqual('boolean');
  expect(typeof isSafari).toEqual('boolean');
  expect(typeof isChrome).toEqual('boolean');
  expect(typeof isOpera).toEqual('boolean');
  expect(typeof isFirefox).toEqual('boolean');
  expect(getKeyNamesByCode(112)).toEqual(['f1']);
});

test('绑定与解绑', async () => {
  const f1 = jest.fn();
  const f2 = jest.fn();
  const f3 = jest.fn();
  const keyboard = new Keyboard();

  keyboard.bind('a', f1);
  keyboard.bind('a', f2);
  keyboard.bind('ctrl + shift + meta + alt + a', f3);

  simulateKeyboardEvent('a');
  await wait();
  expect(f1.mock.calls).toHaveLength(1);
  expect(f2.mock.calls).toHaveLength(1);
  expect(f3.mock.calls).toHaveLength(0);

  simulateKeyboardEvent('a', { ctrlKey: true, shiftKey: true, metaKey: true, altKey: true });
  await wait();
  expect(f1.mock.calls).toHaveLength(1);
  expect(f2.mock.calls).toHaveLength(1);
  expect(f3.mock.calls).toHaveLength(1);

  keyboard.unbind('a', f1);
  simulateKeyboardEvent('a');
  await wait();
  expect(f1.mock.calls).toHaveLength(1);
  expect(f2.mock.calls).toHaveLength(2);
  expect(f3.mock.calls).toHaveLength(1);

  keyboard.unbind('a');
  simulateKeyboardEvent('a');
  await wait();
  expect(f1.mock.calls).toHaveLength(1);
  expect(f2.mock.calls).toHaveLength(2);
  expect(f3.mock.calls).toHaveLength(1);

  keyboard.unbind();
  simulateKeyboardEvent('a', { ctrlKey: true, shiftKey: true, metaKey: true, altKey: true });
  await wait();
  expect(f1.mock.calls).toHaveLength(1);
  expect(f2.mock.calls).toHaveLength(2);
  expect(f3.mock.calls).toHaveLength(1);

  keyboard.destroy();
});
