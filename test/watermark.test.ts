import { genCanvasWM } from '../src/watermark';
import { setupJestCanvasMock } from 'jest-canvas-mock';

beforeEach(() => {
  jest.resetAllMocks();
  setupJestCanvasMock();
});

test('watermark', async () => {
  const res = genCanvasWM('Hello world!');
  expect(res).toBe(undefined);
});
