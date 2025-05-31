import { wait } from '../src/async';
import { genCanvasWM } from '../src/watermark';
import { setupJestCanvasMock } from 'jest-canvas-mock';

beforeEach(() => {
  jest.resetAllMocks();
  setupJestCanvasMock();
});

describe('watermark', () => {
  test('generate watermark success', async () => {
    const divEl = document.createElement('div');
    divEl.style.width = '300px';
    divEl.style.width = '400px';
    document.body.appendChild(divEl);
    const res = genCanvasWM('Hello world!', { rootContainer: divEl, watermarkId: '__wm' });
    // console.log(document.querySelector('#__wm')!.style.width);
    // @ts-ignore
    document.querySelector('#__wm')!.style.width = '200px';
    await wait();
    // @ts-ignore
    document.querySelector('#__wm')!.style.zIndex = '222';
    await wait();
    document.querySelector('#__wm')?.remove();
    await wait();

    expect(res).toBe(undefined);
  });
  test('generate watermark fail', async () => {
    expect(() => genCanvasWM('Hello world!', { rootContainer: 'yyds', watermarkId: '__wm' })).toThrow(
      'yyds is not valid Html Element or element selector'
    );
  });
});
