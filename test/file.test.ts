import { chooseLocalFile, compressImg, supportCanvas } from '../src/file';

type TestBlobCallback = (blob: Blob | null) => void;

const originalCreateElement = document.createElement.bind(document);
const originalCreateImageBitmap = globalThis.createImageBitmap;

function createLargeFile(name = 'photo.jpg', type = 'image/jpeg', sizeKB = 100): File {
  return new File([new Uint8Array(sizeKB * 1024)], name, { type, lastModified: 123 });
}

function createFileList(files: File[]): FileList {
  const fileList: Record<string | number | symbol, unknown> = {
    length: files.length,
    item: (index: number) => files[index] ?? null,
    [Symbol.toStringTag]: 'FileList'
  };
  files.forEach((file, index) => (fileList[index] = file));
  return fileList as unknown as FileList;
}

function mockBitmap(width = 800, height = 600) {
  const close = jest.fn();
  globalThis.createImageBitmap = jest.fn(() => Promise.resolve({ width, height, close } as unknown as ImageBitmap));
  return { close };
}

function mockCanvas(output: Blob = new Blob(['compressed'], { type: 'image/jpeg' })) {
  const context = {
    drawImage: jest.fn(),
    fillRect: jest.fn(),
    imageSmoothingEnabled: false,
    imageSmoothingQuality: 'low',
    fillStyle: ''
  } as unknown as CanvasRenderingContext2D;
  const canvas = {
    width: 0,
    height: 0,
    getContext: jest.fn(() => context),
    toBlob: jest.fn((callback: TestBlobCallback) => callback(output)),
    toDataURL: jest.fn()
  } as unknown as HTMLCanvasElement;
  jest.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
    if (tagName === 'canvas') return canvas;
    return originalCreateElement(tagName);
  }) as typeof document.createElement);
  return { canvas, context };
}

afterEach(() => {
  jest.restoreAllMocks();
  globalThis.createImageBitmap = originalCreateImageBitmap;
  document.body.innerHTML = '';
});

describe('file functions', () => {
  describe('supportCanvas', () => {
    it('checks whether a 2D context can actually be created', () => {
      mockCanvas();
      expect(supportCanvas()).toBe(true);

      jest.restoreAllMocks();
      jest.spyOn(document, 'createElement').mockReturnValue({
        getContext: jest.fn(() => null)
      } as unknown as HTMLCanvasElement);
      expect(supportCanvas()).toBe(false);
    });
  });

  describe('chooseLocalFile', () => {
    it('creates an input, returns selected files and removes the input', done => {
      const click = jest.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => undefined);
      const callback = jest.fn();
      const files = createFileList([createLargeFile()]);

      chooseLocalFile('image/*', callback);

      const input = document.body.querySelector('input') as HTMLInputElement;
      expect(input.type).toBe('file');
      expect(input.accept).toBe('image/*');
      expect(click).toHaveBeenCalledTimes(1);
      Object.defineProperty(input, 'files', { configurable: true, value: files });
      input.dispatchEvent(new Event('change'));

      setTimeout(() => {
        expect(callback).toHaveBeenCalledWith(files);
        expect(document.body.contains(input)).toBe(false);
        done();
      });
    });
  });

  describe('compressImg', () => {
    it('throws for invalid input and invalid options', () => {
      expect(() => compressImg('not a file' as never)).toThrow('not a file require be File or FileList');
      const file = createLargeFile();
      expect(() => compressImg(file, { quality: 2 })).toThrow('quality must be a finite number');
      expect(() => compressImg(file, { concurrency: Infinity })).toThrow('concurrency must be a finite number');
      expect(() => compressImg(file, { mime: 'image/gif' as never })).toThrow('Unsupported image mime type');
    });

    it('returns small files without requiring Canvas', async () => {
      jest.spyOn(document, 'createElement').mockImplementation(() => {
        throw new Error('Canvas must not be used');
      });
      const file = createLargeFile('small.jpg', 'image/jpeg', 1);
      await expect(compressImg(file)).resolves.toEqual({ file });
    });

    it('accepts Blob input for hybrid app and WebView integrations', async () => {
      const blob = new Blob([new Uint8Array(100 * 1024)], { type: 'image/jpeg' });
      mockBitmap();
      mockCanvas(new Blob(['compressed'], { type: 'image/jpeg' }));

      const result = await compressImg(blob, { fileName: 'camera.jpg', outputMode: 'compact' });

      expect(result.file.name).toBe('camera.jpg');
      expect(result.file.type).toBe('image/jpeg');
    });

    it('rejects when Canvas is unavailable', async () => {
      jest.spyOn(document, 'createElement').mockReturnValue({
        getContext: jest.fn(() => null)
      } as unknown as HTMLCanvasElement);
      await expect(compressImg(createLargeFile())).rejects.toThrow('Current runtime environment not support Canvas');
    });

    it('uses async Blob encoding and compact mode without retaining large data URLs', async () => {
      const { close } = mockBitmap(2400, 1200);
      const output = new Blob([new Uint8Array(10 * 1024)], { type: 'image/jpeg' });
      const { canvas, context } = mockCanvas(output);
      const result = await compressImg(createLargeFile(), {
        quality: 0,
        maxSize: 1200,
        outputMode: 'compact'
      });

      expect(canvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0);
      expect(context.drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 1200, 600);
      expect(result).toMatchObject({
        width: 1200,
        height: 600,
        mime: 'image/jpeg',
        compressed: true
      });
      expect(result.origin).toBeUndefined();
      expect(result.beforeSrc).toBeUndefined();
      expect(result.afterSrc).toBeUndefined();
      expect(result.bufferArray).toBeUndefined();
      expect(close).toHaveBeenCalledTimes(1);
    });

    it('uses a meaningful balanced default instead of deriving dimensions from file size', async () => {
      mockBitmap(4032, 3024);
      const { canvas } = mockCanvas(new Blob(['compressed'], { type: 'image/jpeg' }));

      const smallSourceResult = await compressImg(createLargeFile('small-source.jpg', 'image/jpeg', 100), {
        outputMode: 'compact'
      });
      const largeSourceResult = await compressImg(createLargeFile('large-source.jpg', 'image/jpeg', 6000), {
        outputMode: 'compact'
      });

      expect(smallSourceResult).toMatchObject({ width: 1920, height: 1440, targetAchieved: true });
      expect(largeSourceResult).toMatchObject({ width: 1920, height: 1440, targetAchieved: true });
      expect(canvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.82);
    });

    it('honors explicit dimensions exactly and keeps maxSize as a compatibility alias', async () => {
      mockBitmap(2400, 1200);
      const { context } = mockCanvas();

      const result = await compressImg(createLargeFile(), {
        maxSize: 800,
        outputMode: 'compact'
      });

      expect(context.drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 800, 400);
      expect(result).toMatchObject({ width: 800, height: 400 });
    });

    it('preserves useful long-image dimensions while respecting the pixel budget', async () => {
      mockBitmap(1440, 20000);
      mockCanvas();

      const result = await compressImg(createLargeFile('screenshot.png', 'image/png'), {
        mime: 'image/png',
        outputMode: 'compact'
      });

      expect(result.height).toBeGreaterThan(2560);
      expect(result.width! * result.height!).toBeLessThanOrEqual(8 * 1024 * 1024);
    });

    it.each([
      ['very tall screenshot', 386, 8192, 386, 8192],
      ['wide panorama', 2048, 793, 1920, 743]
    ])(
      'keeps compressing a boundary-shaped %s when the first encoding is larger',
      async (_name, sourceWidth, sourceHeight, expectedWidth, expectedHeight) => {
        mockBitmap(sourceWidth as number, sourceHeight as number);
        const { canvas } = mockCanvas();
        (canvas.toBlob as jest.Mock).mockImplementation((callback: TestBlobCallback, type: string, quality: number) => {
          callback(new Blob([new Uint8Array(Math.round(quality * 700 * 1024))], { type }));
        });
        const input = createLargeFile('boundary.jpg', 'image/jpeg', 500);

        const result = await compressImg(input, { outputMode: 'compact' });

        expect(result).toMatchObject({ width: expectedWidth, height: expectedHeight, compressed: true });
        expect(result.file.size).toBeLessThan(input.size);
        expect(result.quality).toBeLessThan(0.82);
        expect(result.iterations).toBeGreaterThan(1);
      }
    );

    it('reduces dimensions when an unchanged-size lossless long screenshot encodes larger', async () => {
      mockBitmap(386, 8192);
      const { canvas } = mockCanvas();
      (canvas.toBlob as jest.Mock).mockImplementation((callback: TestBlobCallback, type: string) => {
        const encodedBytes = Math.round(canvas.width * canvas.height * 0.2);
        callback(new Blob([new Uint8Array(encodedBytes)], { type }));
      });
      const input = createLargeFile('screenshot.png', 'image/png', 500);

      const result = await compressImg(input, { mime: 'image/png', outputMode: 'compact' });

      expect(result.width).toBeLessThan(386);
      expect(result.height).toBeLessThan(8192);
      expect(result.file.size).toBeLessThan(input.size);
      expect(result.iterations).toBeGreaterThan(1);
    });

    it('allows width-only constraints for custom long-image workflows', async () => {
      mockBitmap(1440, 10000);
      const { context } = mockCanvas();

      const result = await compressImg(createLargeFile('screenshot.png', 'image/png'), {
        mime: 'image/png',
        maxWidth: 1200,
        maxPixels: 20_000_000,
        maxCanvasDimension: 10000,
        outputMode: 'compact'
      });

      expect(context.drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 1200, 8333);
      expect(result).toMatchObject({ width: 1200, height: 8333 });
    });

    it('provides scenario presets and iterates toward the target file size', async () => {
      mockBitmap(4032, 3024);
      const { canvas } = mockCanvas();
      (canvas.toBlob as jest.Mock).mockImplementation((callback: TestBlobCallback, type: string, quality: number) =>
        callback(new Blob([new Uint8Array(Math.round(quality * 400 * 1024))], { type }))
      );
      const progress: number[] = [];

      const result = await compressImg(createLargeFile('social.jpg', 'image/jpeg', 2000), {
        preset: 'social',
        outputMode: 'compact',
        onProgress: value => progress.push(value)
      });

      expect(result).toMatchObject({
        width: 1280,
        height: 960,
        targetAchieved: true
      });
      expect(result.afterKB).toBeLessThanOrEqual(300);
      expect(result.quality).toBeGreaterThanOrEqual(0.62);
      expect(result.quality).toBeLessThan(0.82);
      expect(result.iterations).toBeGreaterThan(1);
      expect(progress[0]).toBe(0);
      expect(progress[progress.length - 1]).toBe(100);
    });

    it('reduces dimensions when quality alone cannot reach the target size', async () => {
      mockBitmap(2000, 2000);
      const { canvas } = mockCanvas();
      (canvas.toBlob as jest.Mock).mockImplementation((callback: TestBlobCallback, type: string) => {
        const encodedBytes = Math.max(1, Math.round(canvas.width * canvas.height * 0.2));
        callback(new Blob([new Uint8Array(encodedBytes)], { type }));
      });

      const result = await compressImg(createLargeFile('large.jpg', 'image/jpeg', 2000), {
        maxSize: 2000,
        quality: 0.8,
        minQuality: 0.8,
        targetFileSizeKB: 200,
        maxIterations: 5,
        outputMode: 'compact'
      });

      expect(result.width).toBeLessThan(2000);
      expect(result.height).toBeLessThan(2000);
      expect(result.targetAchieved).toBe(true);
      expect(result.iterations).toBeGreaterThan(1);
    });

    it('applies long-image exemption to presets but not to explicit dimensions', async () => {
      mockBitmap(1000, 10000);
      mockCanvas(new Blob(['compressed'], { type: 'image/jpeg' }));

      const presetResult = await compressImg(createLargeFile(), {
        preset: 'social',
        targetFileSizeKB: null,
        outputMode: 'compact'
      });
      const explicitResult = await compressImg(createLargeFile(), {
        maxWidth: 1280,
        maxHeight: 1280,
        maxPixels: 4 * 1024 * 1024,
        outputMode: 'compact'
      });

      expect(presetResult.height).toBeGreaterThan(1280);
      expect(presetResult.height).toBeLessThanOrEqual(8192);
      expect(explicitResult).toMatchObject({ width: 128, height: 1280 });
    });

    it('allows disabling a preset target size while retaining its dimensions', async () => {
      mockBitmap(1200, 800);
      const { canvas } = mockCanvas(new Blob(['compressed'], { type: 'image/jpeg' }));

      await compressImg(createLargeFile(), {
        preset: 'thumbnail',
        targetFileSizeKB: null,
        outputMode: 'compact'
      });

      expect(canvas.toBlob).toHaveBeenCalledTimes(1);
      expect(canvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.78);
    });

    it('does not skip a small source when a preset target is smaller than the source', async () => {
      mockBitmap(800, 800);
      mockCanvas(new Blob([new Uint8Array(10 * 1024)], { type: 'image/jpeg' }));

      const result = await compressImg(createLargeFile('avatar.jpg', 'image/jpeg', 40), {
        preset: 'thumbnail',
        outputMode: 'compact'
      });

      expect(result).toMatchObject({ compressed: true, targetAchieved: true, width: 400, height: 400 });
    });

    it('supports AVIF when available and can reject silent MIME fallback', async () => {
      mockBitmap();
      const { canvas } = mockCanvas(new Blob(['avif'], { type: 'image/avif' }));
      const result = await compressImg(createLargeFile('photo.jpg'), {
        mime: 'image/avif',
        outputMode: 'compact'
      });
      expect(result.file.name).toBe('photo.avif');
      expect(result.mime).toBe('image/avif');

      (canvas.toBlob as jest.Mock).mockImplementation((callback: TestBlobCallback) =>
        callback(new Blob(['fallback'], { type: 'image/png' }))
      );
      await expect(
        compressImg(createLargeFile(), { mime: 'image/avif', strictMime: true, outputMode: 'compact' })
      ).rejects.toThrow('Current runtime does not support encoding image/avif');
    });

    it('accepts a larger result when explicitly converting to PNG', async () => {
      mockBitmap(800, 600);
      mockCanvas(new Blob([new Uint8Array(200 * 1024)], { type: 'image/png' }));
      const input = createLargeFile('photo.jpg', 'image/jpeg', 100);

      const result = await compressImg(input, { mime: 'image/png', outputMode: 'compact' });

      expect(result.file.type).toBe('image/png');
      expect(result.file.size).toBe(200 * 1024);
      expect(result.file.size).toBeGreaterThan(input.size);
      expect(result.compressed).toBe(true);
    });

    it('limits output pixels and recognizes the MIME returned by Canvas', async () => {
      mockBitmap(8000, 8000);
      const { context } = mockCanvas(new Blob(['png'], { type: 'image/png' }));
      const result = await compressImg(createLargeFile('photo.jpeg'), {
        mime: 'image/webp',
        maxSize: 8000,
        maxPixels: 1_000_000,
        outputMode: 'compact'
      });

      expect(context.drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 1000, 1000);
      expect(result.file.name).toBe('photo.png');
      expect(result.file.type).toBe('image/png');
      expect(result).toMatchObject({ width: 1000, height: 1000, mime: 'image/png' });
    });

    it('keeps legacy result fields by default', async () => {
      mockBitmap();
      mockCanvas(new Blob(['compressed image'], { type: 'image/jpeg' }));
      const origin = createLargeFile();
      const result = await compressImg(origin);

      expect(result.origin).toBe(origin);
      expect(result.beforeSrc).toMatch(/^data:image\/jpeg;base64,/);
      expect(result.afterSrc).toMatch(/^data:image\/jpeg;base64,/);
      expect(result.bufferArray).toBeInstanceOf(Uint8Array);
    });

    it('rejects encoding failures instead of leaving the promise pending', async () => {
      mockBitmap();
      const { canvas } = mockCanvas();
      (canvas.toBlob as jest.Mock).mockImplementation((callback: TestBlobCallback) => callback(null));

      await expect(compressImg(createLargeFile(), { outputMode: 'compact' })).rejects.toThrow(
        'Canvas image encoding failed'
      );
    });

    it('propagates batch options and preserves input order', async () => {
      const files = [createLargeFile('a.jpg', 'image/jpeg', 20), createLargeFile('b.jpg', 'image/jpeg', 30)];
      const createElement = jest.spyOn(document, 'createElement');

      const results = await compressImg(createFileList(files), { minFileSizeKB: 40, concurrency: 1 });

      expect(results.map(result => result.file)).toEqual(files);
      expect(createElement).not.toHaveBeenCalledWith('canvas');
    });

    it('limits the number of images decoded concurrently', async () => {
      let active = 0;
      let maxActive = 0;
      globalThis.createImageBitmap = jest.fn(async () => {
        active++;
        maxActive = Math.max(maxActive, active);
        await new Promise(resolve => setTimeout(resolve, 5));
        active--;
        return { width: 800, height: 600, close: jest.fn() } as unknown as ImageBitmap;
      });
      mockCanvas(new Blob(['compressed'], { type: 'image/jpeg' }));
      const files = createFileList([
        createLargeFile('a.jpg'),
        createLargeFile('b.jpg'),
        createLargeFile('c.jpg'),
        createLargeFile('d.jpg')
      ]);

      await compressImg(files, { concurrency: 2, outputMode: 'compact' });

      expect(maxActive).toBe(2);
    });

    it('supports cancellation before work starts', () => {
      const controller = new AbortController();
      controller.abort();
      expect(() => compressImg(createLargeFile(), { signal: controller.signal })).toThrow('Image compression aborted');
    });
  });
});
