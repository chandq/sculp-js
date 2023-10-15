import { EasingDefine, easingFunctional, easingStringify, getEasing, setEasing } from '../src/easing';

test('get/set', () => {
  expect(getEasing('linear')).toEqual([0, 0, 1, 1]);
  const define: EasingDefine = [0.3, -0.59, 0.69, 1.5];
  setEasing('my-ease', define);
  expect(getEasing('my-ease')).toEqual(define);
});

test('easingFunction', () => {
  const linear = easingFunctional('linear');

  expect(linear(-1)).toBe(0);
  expect(linear(0)).toBe(0);
  expect(linear(1)).toBe(1);
  expect(linear(1.1)).toBe(1);
  expect(linear(0.5)).toBe(0.5);
});

test('timingFunction', () => {
  expect(easingStringify('linear')).toEqual('cubic-bezier(0,0,1,1)');
  expect(easingStringify([0, 0, 0.4, 0.4])).toEqual('cubic-bezier(0,0,0.4,0.4)');
});
