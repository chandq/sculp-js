import { add, subtract, multiply, divide, strip } from '../src/math';
import './utils';

test('add', () => {
  expect(add(0.1, 0.2)).toBe(0.3);
  expect(add(2.3, 2.4)).toBe(4.7);
  expect(add(1, 2)).toBe(3);
});

test('subtract', () => {
  expect(subtract(0.8, 0.7)).toBe(0.1);
  expect(subtract(3, 2)).toBe(1);
});

test('multiply', () => {
  expect(multiply(7, 0.8)).toBe(5.6);
});

test('divide', () => {
  expect(divide(5.6, 7)).toBe(0.8);
  expect(divide(42, 42)).toBe(1);
  expect(divide(5.6, 0.7)).toBe(8);
});
test('strip', () => {
  expect(strip(0.09999999999999998)).toBe(0.1);
  expect(divide(42, 42)).toBe(1);
  expect(divide(5.6, 0.7)).toBe(8);
});
