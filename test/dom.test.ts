import { hasClass, addClass, removeClass, setStyle, getStyle, getComputedCssVal, getStrWidthPx } from '../src/dom';

test('hasClass', () => {
  const el = document.createElement('div');

  expect(hasClass(el, 'class1')).toEqual(false);

  el.className = 'class1';

  expect(hasClass(el, 'class1')).toEqual(true);
  expect(hasClass(el, 'class2')).toEqual(false);

  expect((): void => {
    hasClass(el, 'class3 ');
  }).toThrow('className should not contain space.');
});

test('addClass', () => {
  const el = document.createElement('div');

  el.className = 'class1';

  addClass(el, 'class2 class3');
  expect(el.className).toEqual('class1 class2 class3');
  addClass(el, 'class4');
  expect(el.className).toEqual('class1 class2 class3 class4');
});

test('removeClass', () => {
  const el = document.createElement('div');

  el.className = 'class1 class2';

  removeClass(el, 'class2');
  expect(el.className).toEqual('class1');

  removeClass(el, 'class1 class2');
  expect(el.className).toEqual('');
});

test('setStyle + getStyle', () => {
  const el = document.createElement('div');

  setStyle(el, 'width', '10px');
  expect(el.style.width).toEqual('10px');

  setStyle(el, {
    width: '10px',
    height: '20px'
  });
  expect(getStyle(el, 'width')).toEqual('10px');
  expect(getStyle(el, 'height')).toEqual('20px');
  expect(getStyle(el, 'font-size')).toEqual('');
  expect(getStyle(el, 'backgroundColor')).toEqual('');
});

test('getComputedCssVal', () => {
  const el = document.createElement('div');
  setStyle(el, 'width', '10px');

  expect(getComputedCssVal(el, 'width')).toBe(10);
  expect(getComputedCssVal(el, 'width', false)).toBe('10px');
});
test('getStrWidthPx', () => {
  const width = getStrWidthPx('hello javascript');
  console.log('width', width);
});
