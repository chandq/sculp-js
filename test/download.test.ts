import {
  downloadURL,
  downloadHref,
  downloadBlob,
  crossOriginDownload,
  CrossOriginDownloadError,
  DownloadProgress,
  downloadData,
  FileType
} from '../src/download';
import { LooseParams } from '../src/qs';
import { isFunction } from '../src/type';
import { urlSetParams } from '../src/url';

// Mock dependencies
jest.mock('../src/url', () => ({
  urlSetParams: jest.fn()
}));

// Mock DOM APIs
const mockCreateElement = jest.fn();
const mockClick = jest.fn();
const mockRemoveChild = jest.fn();
const mockOpen = jest.fn();
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();

// Setup DOM mocks
globalThis.document.createElement = mockCreateElement;
globalThis.document.body.appendChild = jest.fn();
globalThis.document.body.removeChild = mockRemoveChild;
globalThis.window.open = mockOpen;
globalThis.URL.createObjectURL = mockCreateObjectURL;
globalThis.URL.revokeObjectURL = mockRevokeObjectURL;

// Mock utility functions
jest.mock('../src/type', () => ({
  isFunction: jest.fn(fn => typeof fn === 'function'),
  isNullish: jest.fn(val => val == null),
  isString: jest.fn(val => typeof val === 'string')
}));

describe('download functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('downloadURL', () => {
    it('should open URL directly when no params provided', () => {
      const url = 'https://example.com/file.pdf';
      downloadURL(url);
      expect(mockOpen).toHaveBeenCalledWith(url);
    });

    it('should set params and open URL when params provided', () => {
      const url = 'https://example.com/file.pdf';
      const params: LooseParams = { id: 1, name: 'test' };
      (urlSetParams as jest.MockedFunction<typeof urlSetParams>).mockReturnValue(
        'https://example.com/file.pdf?id=1&name=test'
      );

      downloadURL(url, params);
      expect(urlSetParams).toHaveBeenCalledWith(url, params);
      expect(mockOpen).toHaveBeenCalledWith('https://example.com/file.pdf?id=1&name=test');
    });
  });

  describe('downloadHref', () => {
    it('should create link element and trigger download', done => {
      const href = 'https://example.com/file.pdf';
      const filename = 'test.pdf';
      const mockLink = {
        download: '',
        style: { display: '' },
        href: '',
        click: mockClick
      };
      mockCreateElement.mockReturnValue(mockLink);

      downloadHref(href, filename);

      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockLink.download).toBe(filename);
      expect(mockLink.style.display).toBe('none');
      expect(mockLink.href).toBe(href);
      expect(mockClick).toHaveBeenCalled();

      // Wait for setTimeout
      setTimeout(() => {
        expect(mockRemoveChild).toHaveBeenCalledWith(mockLink);
        done();
      }, 0);
    });

    it('should call callback if provided', done => {
      const href = 'https://example.com/file.pdf';
      const filename = 'test.pdf';
      const callback = jest.fn();
      const mockLink = {
        download: '',
        style: { display: '' },
        href: '',
        click: mockClick
      };
      mockCreateElement.mockReturnValue(mockLink);

      downloadHref(href, filename, callback);

      setTimeout(() => {
        expect((isFunction as jest.MockedFunction<typeof isFunction>).mock.results[0].value).toBe(true);
        expect(callback).toHaveBeenCalled();
        done();
      }, 0);
    });
  });

  describe('downloadBlob', () => {
    it('should create object URL and download blob', done => {
      const blob = new Blob(['test content'], { type: 'text/plain' });
      const filename = 'test.txt';
      const objURL = 'blob:https://example.com/abc123';
      mockCreateObjectURL.mockReturnValue(objURL);

      const mockLink = {
        download: '',
        style: { display: '' },
        href: '',
        click: mockClick
      };
      mockCreateElement.mockReturnValue(mockLink);

      downloadBlob(blob, filename);

      expect(mockCreateObjectURL).toHaveBeenCalledWith(blob);
      expect(mockCreateElement).toHaveBeenCalledWith('a');

      setTimeout(() => {
        expect(mockRevokeObjectURL).toHaveBeenCalledWith(objURL);
        done();
      }, 0);
    });

    it('should call callback if provided', done => {
      const blob = new Blob(['test content'], { type: 'text/plain' });
      const filename = 'test.txt';
      const callback = jest.fn();
      const objURL = 'blob:https://example.com/abc123';
      mockCreateObjectURL.mockReturnValue(objURL);

      const mockLink = {
        download: '',
        style: { display: '' },
        href: '',
        click: mockClick
      };
      mockCreateElement.mockReturnValue(mockLink);

      // Use Jest's timer mock
      jest.useFakeTimers();

      downloadBlob(blob, filename, callback);

      // Fast-forward time to execute setTimeout
      jest.runAllTimers();

      expect(mockCreateObjectURL).toHaveBeenCalledWith(blob);
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockRemoveChild).toHaveBeenCalledWith(mockLink);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith(objURL);
      expect(callback).toHaveBeenCalled();

      // Restore real timers
      jest.useRealTimers();
      done();
    });
  });

  describe('crossOriginDownload', () => {
    const url = 'https://example.com/file.pdf';
    const filename = 'test.pdf';
    const NativeBlob = globalThis.Blob;
    const NativeFileReader = globalThis.FileReader;
    const globals = ['fetch', 'XMLHttpRequest', 'Headers', 'FileReader'] as const;
    let descriptors: Array<PropertyDescriptor | undefined>;
    let xhr: {
      open: jest.Mock;
      send: jest.Mock;
      abort: jest.Mock;
      setRequestHeader: jest.Mock;
      getResponseHeader: jest.Mock;
      responseType: string;
      response: Blob;
      status: number;
      onload: ((event: ProgressEvent) => void) | null;
      onprogress: ((event: ProgressEvent) => void) | null;
      onerror: ((event: ProgressEvent) => void) | null;
      onabort: (() => void) | null;
    };
    let fetchMock: jest.Mock;
    let link: { download: string; href: string; style: { display: string }; click: jest.Mock };
    const setGlobal = (name: string, value: unknown) => {
      Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
    };
    const event = (loaded = 8, total = 8, lengthComputable = true) =>
      new ProgressEvent('progress', { loaded, total, lengthComputable });
    const response = (status = 200, type = 'application/pdf', blob = new NativeBlob(['contents'], { type })) => ({
      status,
      headers: { get: jest.fn(() => type) },
      blob: jest.fn().mockResolvedValue(blob)
    });
    const flush = async () => {
      for (let i = 0; i < 8; i++) await Promise.resolve();
    };
    const finishSave = async () => {
      await flush();
      jest.runOnlyPendingTimers();
      await flush();
    };
    const deferred = <T>() => {
      let resolve!: (value: T) => void;
      let reject!: (reason: unknown) => void;
      const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    };

    beforeEach(() => {
      jest.useFakeTimers();
      descriptors = globals.map(name => Object.getOwnPropertyDescriptor(globalThis, name));
      xhr = {
        open: jest.fn(),
        send: jest.fn(),
        abort: jest.fn(),
        setRequestHeader: jest.fn(),
        getResponseHeader: jest.fn(() => 'application/pdf'),
        responseType: '',
        response: new NativeBlob(['contents']),
        status: 200,
        onload: null,
        onprogress: null,
        onerror: null,
        onabort: null
      };
      fetchMock = jest.fn().mockResolvedValue(response());
      setGlobal('fetch', fetchMock);
      setGlobal(
        'XMLHttpRequest',
        jest.fn(() => xhr)
      );
      setGlobal('FileReader', NativeFileReader);
      link = { download: '', href: '', style: { display: '' }, click: mockClick };
      mockClick.mockReset();
      mockCreateElement.mockReset().mockReturnValue(link);
      mockCreateObjectURL.mockReset().mockReturnValue('blob:download');
      mockRemoveChild.mockReset();
      mockRevokeObjectURL.mockReset();
      (document.body.appendChild as jest.Mock).mockReset();
    });

    afterEach(() => {
      globals.forEach((name, index) => {
        const descriptor = descriptors[index];
        if (descriptor) Object.defineProperty(globalThis, name, descriptor);
        else Reflect.deleteProperty(globalThis, name);
      });
      jest.useRealTimers();
    });

    it.each([
      [undefined, false, true, 'fetch'],
      ['auto', false, true, 'fetch'],
      ['auto', false, false, 'xhr'],
      ['auto', true, true, 'xhr'],
      ['auto', true, false, 'xhr'],
      ['xhr', false, true, 'xhr'],
      ['xhr', true, true, 'xhr'],
      ['fetch', false, true, 'fetch']
    ] as const)(
      'selects %s with progress=%s and fetch available=%s',
      async (transport, withProgress, hasFetch, selected) => {
        if (!hasFetch) setGlobal('fetch', undefined);
        const onProgress = withProgress ? jest.fn() : undefined;
        const onResolved = jest.fn();
        const task = crossOriginDownload(url, filename, { transport, onProgress }).then(onResolved);
        if (selected === 'xhr') {
          expect(fetchMock).not.toHaveBeenCalled();
          expect(xhr.open).toHaveBeenCalledWith('GET', url, true);
          expect(xhr.responseType).toBe('blob');
          expect(xhr.send).toHaveBeenCalledTimes(1);
          expect(Boolean(xhr.onprogress)).toBe(withProgress);
          xhr.onload!(event());
        } else {
          expect(fetchMock).toHaveBeenCalledWith(url, { method: 'GET', headers: undefined, signal: undefined });
          expect(globalThis.XMLHttpRequest).not.toHaveBeenCalled();
        }
        expect(onResolved).not.toHaveBeenCalled();
        await finishSave();
        await expect(task).resolves.toBeUndefined();
        expect(onResolved).toHaveBeenCalledTimes(1);
        expect(mockClick).toHaveBeenCalledTimes(1);
        expect(mockRemoveChild).toHaveBeenCalledWith(link);
        expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:download');
        expect(link.download).toBe(filename);
      }
    );

    it.each(['fetch', 'xhr'] as const)('ignores removed callbacks from JavaScript callers on %s', async transport => {
      const successCallback = jest.fn();
      const failCallback = jest.fn();
      const legacyOptions = { transport, successCallback, failCallback };
      const task = crossOriginDownload(url, filename, legacyOptions);
      if (transport === 'xhr') xhr.onload!(event());
      await finishSave();
      await expect(task).resolves.toBeUndefined();

      fetchMock.mockRejectedValueOnce(new Error('offline'));
      const failed = crossOriginDownload(url, filename, legacyOptions);
      if (transport === 'xhr') xhr.onerror!(event());
      await expect(failed).rejects.toMatchObject({ code: 'ERROR_CONNECTION_REFUSED' });
      expect(successCallback).not.toHaveBeenCalled();
      expect(failCallback).not.toHaveBeenCalled();
    });

    it('preserves error constructor arguments and supports an optional reason', () => {
      const cause = new Error('underlying failure');
      const error = new CrossOriginDownloadError('DOWNLOAD_ERROR', 200, cause);
      expect(error).toBeInstanceOf(Error);
      expect(error.cause).toBe(cause);
      expect(error.message).toBe('Download failed: DOWNLOAD_ERROR (status 200)');
      expect(new CrossOriginDownloadError('DOWNLOAD_ERROR', 200, cause, 'Saving failed.').message).toBe(
        'Download failed: DOWNLOAD_ERROR (status 200): Saving failed.'
      );
    });

    it('explains when saving is unavailable without a document', async () => {
      const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'document')!;
      setGlobal('document', undefined);
      try {
        await expect(crossOriginDownload(url, filename)).rejects.toMatchObject({
          code: 'UNSUPPORTED_ENVIRONMENT',
          message: expect.stringContaining('Saving a download requires a browser document.')
        });
        expect(fetchMock).not.toHaveBeenCalled();
        expect(xhr.send).not.toHaveBeenCalled();
      } finally {
        Object.defineProperty(globalThis, 'document', descriptor);
      }
    });

    it('rejects explicit fetch with progress before making a request', async () => {
      await expect(
        crossOriginDownload(url, filename, { transport: 'fetch', onProgress: jest.fn() })
      ).rejects.toMatchObject({
        code: 'INVALID_OPTIONS',
        status: 0,
        message: expect.stringContaining('onProgress requires XHR; use transport "auto" or "xhr".')
      });
      expect(fetchMock).not.toHaveBeenCalled();
      expect(xhr.open).not.toHaveBeenCalled();
    });

    it.each([
      ['fetch', 'fetch is not available'],
      ['xhr', 'XMLHttpRequest is not available'],
      ['progress', 'onProgress requires XMLHttpRequest'],
      ['dom', 'Saving a download requires URL.createObjectURL and URL.revokeObjectURL.']
    ] as const)('rejects unavailable %s without silently changing capabilities', async (unavailable, reason) => {
      if (unavailable === 'fetch') setGlobal('fetch', undefined);
      if (unavailable === 'xhr' || unavailable === 'progress') setGlobal('XMLHttpRequest', undefined);
      if (unavailable === 'dom') globalThis.URL.createObjectURL = undefined as unknown as typeof URL.createObjectURL;
      try {
        await expect(
          crossOriginDownload(url, filename, {
            transport: unavailable === 'fetch' ? 'fetch' : unavailable === 'xhr' ? 'xhr' : 'auto',
            onProgress: unavailable === 'progress' ? jest.fn() : undefined
          })
        ).rejects.toMatchObject({ code: 'UNSUPPORTED_ENVIRONMENT', message: expect.stringContaining(reason) });
        expect(fetchMock).not.toHaveBeenCalled();
        expect(xhr.send).not.toHaveBeenCalled();
      } finally {
        globalThis.URL.createObjectURL = mockCreateObjectURL;
      }
    });

    it.each(['fetch', 'xhr'] as const)('passes request headers through %s', async transport => {
      const headers = { Authorization: 'Bearer token', 'X-Export': 'yes' };
      const task = crossOriginDownload(url, filename, { transport, headers });
      if (transport === 'xhr') {
        expect(xhr.setRequestHeader.mock.calls).toEqual(Object.entries(headers));
        expect(xhr.setRequestHeader.mock.invocationCallOrder[0]).toBeLessThan(xhr.send.mock.invocationCallOrder[0]);
        xhr.onload!(event());
      } else expect(fetchMock.mock.calls[0][1].headers).toBe(headers);
      await finishSave();
      await task;
    });

    it.each(['object', 'pairs', 'headers'] as const)(
      'supports %s headers without requiring a global Headers constructor',
      async shape => {
        setGlobal('Headers', undefined);
        const pairs: [string, string][] = [
          ['Authorization', 'Bearer token'],
          ['X-Export', 'yes']
        ];
        const headers =
          shape === 'object'
            ? Object.fromEntries(pairs)
            : shape === 'pairs'
            ? pairs
            : ({
                forEach(callback: (value: string, name: string) => void) {
                  pairs.forEach(([name, value]) => callback(value, name));
                }
              } as Headers);
        const task = crossOriginDownload(url, filename, { transport: 'xhr', headers });
        expect(xhr.setRequestHeader.mock.calls).toEqual(pairs);
        xhr.onload!(event());
        await finishSave();
        await task;
      }
    );

    it.each(['fetch', 'xhr'] as const)('supports a custom success status on %s', async transport => {
      fetchMock.mockResolvedValue(response(201));
      xhr.status = 201;
      const task = crossOriginDownload(url, filename, { transport, successCode: 201 });
      if (transport === 'xhr') xhr.onload!(event());
      await finishSave();
      await expect(task).resolves.toBeUndefined();
    });

    it('accepts omitted and runtime null options', async () => {
      for (const options of [undefined, null]) {
        const task = crossOriginDownload(url, filename, options as undefined);
        await finishSave();
        await task;
      }
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('uses native progress units and emits one final event before saving', async () => {
      const onProgress = jest.fn();
      const task = crossOriginDownload(url, filename, { onProgress });
      expect(onProgress).toHaveBeenLastCalledWith({
        loaded: 0,
        total: undefined,
        percent: undefined,
        lengthComputable: false,
        done: false
      });
      xhr.onprogress!(event(3, 12));
      expect(onProgress).toHaveBeenLastCalledWith({
        loaded: 3,
        total: 12,
        percent: 25,
        lengthComputable: true,
        done: false
      });
      const onload = xhr.onload!;
      onload(event(12, 12));
      onload(event(12, 12));
      expect(onProgress).toHaveBeenLastCalledWith({
        loaded: 12,
        total: 12,
        percent: 100,
        lengthComputable: true,
        done: true
      });
      expect(onProgress.mock.calls.filter(([p]) => p.done)).toHaveLength(1);
      expect(onProgress.mock.invocationCallOrder[2]).toBeLessThan(mockClick.mock.invocationCallOrder[0]);
      await finishSave();
      await task;
      expect(xhr.onprogress).toBeNull();
      expect(xhr.onload).toBeNull();
    });

    it.each([
      [4, 0, false],
      [0, 0, true],
      [4, 0, true]
    ] as const)('handles unknown or empty progress (%s/%s)', async (loaded, total, computable) => {
      const onProgress = jest.fn();
      const task = crossOriginDownload(url, filename, { onProgress });
      xhr.onprogress!(event(loaded, total, computable));
      xhr.onload!(event(loaded, total, computable));
      expect(onProgress).toHaveBeenLastCalledWith({
        loaded,
        total: undefined,
        percent: undefined,
        lengthComputable: false,
        done: true
      });
      await finishSave();
      await task;
    });

    it('clamps percentage without replacing native byte counts with Blob size', async () => {
      const onProgress = jest.fn();
      const task = crossOriginDownload(url, filename, { onProgress });
      xhr.onload!(event(20, 10));
      expect(onProgress).toHaveBeenLastCalledWith(expect.objectContaining({ loaded: 20, total: 10, percent: 100 }));
      await finishSave();
      await task;
    });

    it.each(['fetch', 'xhr'] as const)(
      'preserves non-JSON HTTP errors on %s and does not accept arbitrary 2xx',
      async transport => {
        const blob = new NativeBlob(['wrong status']);
        fetchMock.mockResolvedValue(response(201, 'text/plain', blob));
        xhr.status = 201;
        xhr.response = blob;
        const task = crossOriginDownload(url, filename, { transport });
        if (transport === 'xhr') xhr.onload!(event());
        const error = await task.catch(error => error);
        expect(error).toBeInstanceOf(CrossOriginDownloadError);
        expect(error.code).toBe('HTTP_ERROR');
        expect(error.status).toBe(201);
        expect(error.message).toContain('Expected HTTP status 200.');
        expect(error.response).toBe(blob);
        expect(mockClick).not.toHaveBeenCalled();
        expect(xhr.abort).not.toHaveBeenCalled();
      }
    );

    it.each(['fetch', 'xhr'] as const)('preserves JSON error text on %s', async transport => {
      const blob = new NativeBlob(['{"error":"missing"}'], { type: 'application/json' });
      Object.defineProperty(blob, 'text', { value: jest.fn().mockResolvedValue('{"error":"missing"}') });
      fetchMock.mockResolvedValue(response(404, 'application/json; charset=utf-8', blob));
      xhr.status = 404;
      xhr.response = blob;
      xhr.getResponseHeader.mockReturnValue('application/json');
      const task = crossOriginDownload(url, filename, { transport });
      if (transport === 'xhr') xhr.onload!(event());
      await expect(task).rejects.toMatchObject({ status: 404, code: 'HTTP_ERROR', response: '{"error":"missing"}' });
    });

    it('reads JSON with FileReader when Blob.text is unavailable', async () => {
      jest.useRealTimers();
      xhr.status = 400;
      xhr.response = new NativeBlob(['{"error":true}']);
      xhr.getResponseHeader.mockReturnValue('application/json');
      const task = crossOriginDownload(url, filename, { transport: 'xhr' });
      xhr.onload!(event());
      await expect(task).rejects.toMatchObject({ response: '{"error":true}' });
    });

    it('preserves HTTP status when reading JSON error text fails', async () => {
      const cause = new Error('read failed');
      const blob = new NativeBlob();
      Object.defineProperty(blob, 'text', { value: () => Promise.reject(cause) });
      fetchMock.mockResolvedValue(response(403, 'application/json', blob));
      await expect(crossOriginDownload(url, filename)).rejects.toMatchObject({
        status: 403,
        code: 'HTTP_ERROR',
        message: expect.stringContaining('Failed to read the JSON error response body.'),
        cause
      });
      expect(xhr.send).not.toHaveBeenCalled();
    });

    it.each(['fetch', 'xhr'] as const)('reports network failure once on %s without fallback', async transport => {
      const cause = new Error('offline');
      fetchMock.mockRejectedValue(cause);
      const task = crossOriginDownload(url, filename, { transport });
      if (transport === 'xhr') {
        const onerror = xhr.onerror!;
        onerror(event());
        onerror(event());
      }
      await expect(task).rejects.toMatchObject({ status: 0, code: 'ERROR_CONNECTION_REFUSED' });
      expect(mockClick).not.toHaveBeenCalled();
      if (transport === 'fetch') expect(xhr.send).not.toHaveBeenCalled();
    });

    it.each([200, 404])('handles response.blob failure with status %s', async status => {
      const cause = new Error('body failed');
      const res = response(status);
      res.blob.mockRejectedValue(cause);
      fetchMock.mockResolvedValue(res);
      await expect(crossOriginDownload(url, filename)).rejects.toMatchObject({
        status,
        cause,
        code: status === 200 ? 'ERROR_CONNECTION_REFUSED' : 'HTTP_ERROR',
        message: expect.stringContaining('Failed to read the response body.')
      });
      expect(xhr.send).not.toHaveBeenCalled();
    });

    it.each(['fetch', 'xhr'] as const)('does not start an already cancelled %s request', async transport => {
      const controller = new AbortController();
      controller.abort('cancelled');
      await expect(crossOriginDownload(url, filename, { transport, signal: controller.signal })).rejects.toMatchObject({
        code: 'ABORTED',
        cause: 'cancelled'
      });
      expect(fetchMock).not.toHaveBeenCalled();
      expect(xhr.send).not.toHaveBeenCalled();
    });

    it.each(['fetch', 'xhr'] as const)('cancels active %s once and ignores late completion', async transport => {
      const pending = deferred<ReturnType<typeof response>>();
      fetchMock.mockReturnValue(pending.promise);
      const controller = new AbortController();
      const removeListener = jest.spyOn(controller.signal, 'removeEventListener');
      const task = crossOriginDownload(url, filename, { transport, signal: controller.signal });
      const onload = xhr.onload;
      controller.abort();
      await expect(task).rejects.toMatchObject({ code: 'ABORTED' });
      pending.resolve(response());
      onload?.(event());
      await flush();
      expect(mockClick).not.toHaveBeenCalled();
      expect(removeListener).toHaveBeenCalledWith('abort', expect.any(Function));
      if (transport === 'xhr') expect(xhr.abort).toHaveBeenCalledTimes(1);
      else expect(fetchMock.mock.calls[0][1].signal).toBe(controller.signal);
    });

    it('preserves the received XHR status when cancelled without progress monitoring', async () => {
      const controller = new AbortController();
      xhr.status = 0;
      xhr.abort.mockImplementation(() => {
        xhr.status = 0;
      });
      const task = crossOriginDownload(url, filename, { transport: 'xhr', signal: controller.signal });
      expect(xhr.onprogress).toBeNull();
      // 响应头已到达，但响应体仍在传输，尚未触发 load。
      xhr.status = 206;
      controller.abort('cancelled');
      await expect(task).rejects.toMatchObject({ code: 'ABORTED', status: 206, cause: 'cancelled' });
      expect(xhr.abort).toHaveBeenCalledTimes(1);
      expect(xhr.status).toBe(0);
      expect(mockClick).not.toHaveBeenCalled();
    });

    it('cancels while reading the fetch response body', async () => {
      const pending = deferred<Blob>();
      const res = response();
      res.blob.mockReturnValue(pending.promise);
      fetchMock.mockResolvedValue(res);
      const controller = new AbortController();
      const task = crossOriginDownload(url, filename, { signal: controller.signal });
      await flush();
      controller.abort();
      await expect(task).rejects.toMatchObject({ code: 'ABORTED', status: 200 });
      pending.resolve(new NativeBlob());
      await flush();
      expect(mockClick).not.toHaveBeenCalled();
    });

    it('cancels while reading an HTTP error body and ignores its later resolution', async () => {
      const pending = deferred<string>();
      const blob = new NativeBlob();
      Object.defineProperty(blob, 'text', { value: () => pending.promise });
      fetchMock.mockResolvedValue(response(400, 'application/json', blob));
      const controller = new AbortController();
      const task = crossOriginDownload(url, filename, { signal: controller.signal });
      await flush();
      controller.abort();
      await expect(task).rejects.toMatchObject({ code: 'ABORTED', status: 400 });
      pending.resolve('{}');
      await flush();
    });

    it('allows cancelling in the final progress callback before saving', async () => {
      const controller = new AbortController();
      const task = crossOriginDownload(url, filename, {
        signal: controller.signal,
        onProgress: ({ done }) => {
          if (done) controller.abort();
        }
      });
      xhr.onload!(event());
      await expect(task).rejects.toMatchObject({ code: 'ABORTED' });
      expect(mockCreateObjectURL).not.toHaveBeenCalled();
    });

    it('cleans a prepared link when cancelled immediately before click', async () => {
      const controller = new AbortController();
      (document.body.appendChild as jest.Mock).mockImplementation(() => controller.abort());
      const task = crossOriginDownload(url, filename, { signal: controller.signal });
      await expect(task).rejects.toMatchObject({ code: 'ABORTED' });
      expect(mockClick).not.toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalledTimes(1);
      expect(mockRevokeObjectURL).toHaveBeenCalledTimes(1);
    });

    it('ignores cancellation after click and resolves after cleanup', async () => {
      const controller = new AbortController();
      const onResolved = jest.fn();
      mockClick.mockImplementation(() => controller.abort());
      const task = crossOriginDownload(url, filename, { signal: controller.signal }).then(onResolved);
      await finishSave();
      await expect(task).resolves.toBeUndefined();
      expect(onResolved).toHaveBeenCalledTimes(1);
      expect(mockRevokeObjectURL.mock.invocationCallOrder[0]).toBeLessThan(onResolved.mock.invocationCallOrder[0]);
    });

    it.each(['initial', 'progress', 'final'] as const)(
      'stops XHR when the %s progress callback throws',
      async phase => {
        const cause = new Error('UI failed');
        const onProgress = jest.fn(({ loaded, done }: DownloadProgress) => {
          if (phase === 'initial' || (phase === 'progress' && loaded > 0) || (phase === 'final' && done)) throw cause;
        });
        const task = crossOriginDownload(url, filename, { onProgress });
        if (phase === 'progress') xhr.onprogress!(event(1, 8));
        if (phase === 'final') xhr.onload!(event());
        await expect(task).rejects.toBe(cause);
        expect(xhr.abort).toHaveBeenCalledTimes(1);
        expect(mockClick).not.toHaveBeenCalled();
        if (phase === 'initial') expect(xhr.send).not.toHaveBeenCalled();
      }
    );

    it.each(['url', 'create', 'append', 'click', 'remove', 'revoke'] as const)(
      'settles and attempts cleanup when %s fails',
      async stage => {
        const cause = new Error(stage);
        const throwing = () => {
          throw cause;
        };
        if (stage === 'url') mockCreateObjectURL.mockImplementation(throwing);
        if (stage === 'create') mockCreateElement.mockImplementation(throwing);
        if (stage === 'append') (document.body.appendChild as jest.Mock).mockImplementation(throwing);
        if (stage === 'click') mockClick.mockImplementation(throwing);
        if (stage === 'remove') mockRemoveChild.mockImplementation(throwing);
        if (stage === 'revoke') mockRevokeObjectURL.mockImplementation(throwing);
        const task = crossOriginDownload(url, filename, {});
        const assertion = expect(task).rejects.toMatchObject({ code: 'DOWNLOAD_ERROR', status: 200, cause });
        await finishSave();
        await assertion;
        if (stage !== 'url') expect(mockRevokeObjectURL).toHaveBeenCalledTimes(1);
        if (['click', 'remove', 'revoke'].includes(stage)) expect(mockRemoveChild).toHaveBeenCalledTimes(1);
      }
    );

    it('accepts a real Headers instance on both transports', async () => {
      const NativeHeaders = require('node:vm').runInThisContext('Headers') as typeof Headers;
      const headers = new NativeHeaders({ Authorization: 'Bearer token', 'X-Export': 'yes' });
      for (const transport of ['xhr', 'fetch'] as const) {
        const task = crossOriginDownload(url, filename, { transport, headers });
        if (transport === 'xhr') {
          expect(xhr.setRequestHeader.mock.calls).toEqual(Array.from(headers.entries()));
          xhr.onload!(event());
        } else expect(fetchMock.mock.calls[0][1].headers).toBe(headers);
        await finishSave();
        await task;
      }
    });

    it.each(['http', 'network', 'abort'] as const)(
      'never reports successful completion for %s failure',
      async failure => {
        const onProgress = jest.fn();
        const task = crossOriginDownload(url, filename, { onProgress });
        if (failure === 'http') {
          xhr.status = 404;
          xhr.onload!(event());
        } else if (failure === 'network') xhr.onerror!(event());
        else xhr.onabort!();
        await expect(task).rejects.toBeInstanceOf(CrossOriginDownloadError);
        expect(onProgress.mock.calls.every(([progress]) => !progress.done)).toBe(true);
        expect(mockClick).not.toHaveBeenCalled();
      }
    );

    it.each(['cancel', 'error', 'throw'] as const)('settles and cleans FileReader on %s', async mode => {
      const cause = new Error('read failure');
      const fileReader = {
        readyState: 1,
        result: null,
        error: cause,
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        onabort: null as (() => void) | null,
        readAsText: jest.fn(),
        abort: jest.fn()
      };
      if (mode === 'throw')
        fileReader.readAsText.mockImplementation(() => {
          throw cause;
        });
      setGlobal(
        'FileReader',
        jest.fn(() => fileReader)
      );
      xhr.status = 400;
      xhr.getResponseHeader.mockReturnValue('application/json');
      const controller = new AbortController();
      const task = crossOriginDownload(url, filename, { transport: 'xhr', signal: controller.signal });
      const onload = xhr.onload!;
      onload(event());
      onload(event());
      expect(fileReader.readAsText).toHaveBeenCalledTimes(1);
      if (mode === 'cancel') controller.abort();
      if (mode === 'error') fileReader.onerror!();
      await expect(task).rejects.toMatchObject({ code: mode === 'cancel' ? 'ABORTED' : 'HTTP_ERROR', status: 400 });
      await flush();
      expect(fileReader.onload).toBeNull();
      expect(fileReader.onerror).toBeNull();
      expect(fileReader.onabort).toBeNull();
      expect(xhr.onload).toBeNull();
      if (mode === 'cancel') expect(fileReader.abort).toHaveBeenCalledTimes(1);
    });

    it('ignores late XHR error and abort events after saving starts', async () => {
      const task = crossOriginDownload(url, filename, { transport: 'xhr' });
      const onerror = xhr.onerror!;
      const onabort = xhr.onabort!;
      xhr.onload!(event());
      onerror(event());
      onabort();
      await finishSave();
      await expect(task).resolves.toBeUndefined();
    });

    it('removes the abort listener on ordinary failure and success', async () => {
      const controller = new AbortController();
      const addListener = jest.spyOn(controller.signal, 'addEventListener');
      const removeListener = jest.spyOn(controller.signal, 'removeEventListener');
      fetchMock.mockRejectedValueOnce(new Error('offline'));
      await expect(crossOriginDownload(url, filename, { signal: controller.signal })).rejects.toBeInstanceOf(
        CrossOriginDownloadError
      );
      expect(removeListener).toHaveBeenCalledWith('abort', addListener.mock.calls[0][1]);
      const task = crossOriginDownload(url, filename, { signal: controller.signal });
      await finishSave();
      await task;
      expect(removeListener).toHaveBeenCalledWith('abort', addListener.mock.calls[1][1]);
    });

    it('rejects header setup and synchronous send errors without saving', async () => {
      xhr.setRequestHeader.mockImplementationOnce(() => {
        throw new TypeError('bad header');
      });
      await expect(
        crossOriginDownload(url, filename, { transport: 'xhr', headers: { bad: 'value' } })
      ).rejects.toMatchObject({ code: 'INVALID_OPTIONS' });
      expect(xhr.send).not.toHaveBeenCalled();
      xhr.send.mockImplementationOnce(() => {
        throw new Error('send failed');
      });
      await expect(crossOriginDownload(url, filename, { transport: 'xhr' })).rejects.toMatchObject({
        code: 'ERROR_CONNECTION_REFUSED'
      });
      expect(mockClick).not.toHaveBeenCalled();
    });
  });

  describe('downloadData', () => {
    it('should download JSON data', () => {
      const data = { name: 'John', age: 30 };
      const fileType: FileType = 'json';
      const filename = 'test';
      const expectedFilename = 'test.json';

      const mockBlob = new Blob(['{"name":"John","age":30}'], { type: 'application/json' });
      (globalThis.Blob as jest.Mock) = jest.fn().mockImplementation(content => mockBlob);

      const mockLink = {
        download: '',
        style: { display: '' },
        href: '',
        click: mockClick
      };
      mockCreateElement.mockReturnValue(mockLink);
      mockCreateObjectURL.mockReturnValue('blob:https://example.com/abc123');

      downloadData(data, fileType, filename);

      expect(globalThis.Blob).toHaveBeenCalledWith([JSON.stringify(data, null, 4)]);
      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
    });

    it('should download CSV data with headers', () => {
      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 }
      ];
      const fileType: FileType = 'csv';
      const filename = 'test';
      const headers = ['name', 'age'];
      const expectedFilename = 'test.csv';

      const mockLink = {
        download: '',
        style: { display: '' },
        href: '',
        click: mockClick
      };
      mockCreateElement.mockReturnValue(mockLink);

      downloadData(data, fileType, filename, headers);

      expect(mockCreateElement).toHaveBeenCalledWith('a');
    });

    it('should download XLS data with headers', () => {
      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 }
      ];
      const fileType: FileType = 'xls';
      const filename = 'test';
      const headers = ['name', 'age'];

      const mockLink = {
        download: '',
        style: { display: '' },
        href: '',
        click: mockClick
      };
      mockCreateElement.mockReturnValue(mockLink);

      downloadData(data, fileType, filename, headers);

      expect(mockCreateElement).toHaveBeenCalledWith('a');
    });

    it('should download XLSX data with headers', () => {
      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 }
      ];
      const fileType: FileType = 'xlsx';
      const filename = 'test';
      const headers = ['name', 'age'];

      const mockLink = {
        download: '',
        style: { display: '' },
        href: '',
        click: mockClick
      };
      mockCreateElement.mockReturnValue(mockLink);

      downloadData(data, fileType, filename, headers);

      expect(mockCreateElement).toHaveBeenCalledWith('a');
    });

    it('should throw error when no headers provided for CSV/XLS/XLSX', () => {
      const data = [{ name: 'John', age: 30 }];
      const fileType: FileType = 'csv';
      const filename = 'test';

      expect(() => {
        downloadData(data, fileType, filename);
      }).toThrow('未传入表头数据');
    });

    it('should throw error when data is not array for CSV/XLS/XLSX', () => {
      const data = { name: 'John', age: 30 };
      const fileType: FileType = 'csv';
      const filename = 'test';
      const headers = ['name', 'age'];

      expect(() => {
        downloadData(data, fileType, filename, headers);
      }).toThrow('data error! expected array!');
    });
  });
});
