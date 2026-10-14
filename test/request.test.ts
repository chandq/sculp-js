/** @jest-environment node */
import requestModule, { request, RequestError, RequestOptions } from '../src/request';
import sculp, { request as rootRequest } from '../src/index';
import core, { request as coreRequest } from '../src/core-index';

const event = (loaded = 10, total = 10) => ({ loaded, total, lengthComputable: total > 0 }) as ProgressEvent;
const response = (status = 200, text = '{"id":1}') => ({
  status,
  headers: new Headers({ 'Content-Type': 'application/json', 'X-Request-Id': 'test' }),
  text: jest.fn().mockResolvedValue(text),
  blob: jest.fn().mockResolvedValue(new Blob([text]))
});
function mockXHR() {
  return {
    status: 200,
    response: '{"id":1}' as string | Blob,
    responseType: '',
    withCredentials: false,
    onload: null as ((event: ProgressEvent) => void) | null,
    onprogress: null as ((event: ProgressEvent) => void) | null,
    onerror: null as ((event: ProgressEvent) => void) | null,
    onabort: null as (() => void) | null,
    open: jest.fn(),
    send: jest.fn(),
    abort: jest.fn(),
    setRequestHeader: jest.fn(),
    getResponseHeader: jest.fn(() => 'application/json'),
    getAllResponseHeaders: jest.fn(() => 'Content-Type: application/json\r\nX-Request-Id: test\r\n')
  };
}

describe('request', () => {
  const globals = ['fetch', 'XMLHttpRequest', 'AbortController'] as const;
  let descriptors: Array<PropertyDescriptor | undefined>;
  let xhr: ReturnType<typeof mockXHR>;
  let fetchMock: jest.Mock;
  beforeEach(() => {
    descriptors = globals.map(name => Object.getOwnPropertyDescriptor(globalThis, name));
    xhr = mockXHR();
    fetchMock = jest.fn().mockResolvedValue(response());
    Object.defineProperty(globalThis, 'fetch', { configurable: true, writable: true, value: fetchMock });
    Object.defineProperty(globalThis, 'XMLHttpRequest', {
      configurable: true,
      writable: true,
      value: jest.fn(() => xhr)
    });
  });
  afterEach(() => {
    globals.forEach((name, i) => {
      if (descriptors[i]) Object.defineProperty(globalThis, name, descriptors[i]!);
      else Reflect.deleteProperty(globalThis, name);
    });
  });

  it('exports the same functions from root, core and submodule without a DOM', () => {
    expect(typeof document).toBe('undefined');
    for (const fn of [rootRequest, coreRequest, sculp.request, core.request, requestModule.request]) {
      expect(fn).toBe(request);
    }
    expect(sculp.RequestError).toBe(RequestError);
    expect(core.RequestError).toBe(RequestError);
    expect(requestModule.RequestError).toBe(RequestError);
  });

  it('defaults to GET and fetch with a parsed result and normalized headers', async () => {
    await expect(request('/users')).resolves.toEqual({
      status: 200,
      headers: { 'content-type': 'application/json', 'x-request-id': 'test' },
      data: { id: 1 }
    });
    expect(fetchMock).toHaveBeenCalledWith('/users', { method: 'GET', headers: undefined, signal: undefined });
    expect(xhr.send).not.toHaveBeenCalled();
  });

  describe.each(['fetch', 'xhr'] as const)('%s', transport => {
    const finish = () => {
      if (transport === 'xhr') xhr.onload!(event());
    };
    const sentBody = () => (transport === 'xhr' ? xhr.send.mock.calls[0][0] : fetchMock.mock.calls[0][1].body);
    const sentHeaders = () =>
      new Headers(transport === 'xhr' ? xhr.setRequestHeader.mock.calls : fetchMock.mock.calls[0][1].headers);

    it.each(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const)('supports %s', async method => {
      const task = request('/users', { method, transport });
      finish();
      const result = await task;
      expect(result.data).toEqual(method === 'HEAD' ? undefined : { id: 1 });
      if (transport === 'xhr') expect(xhr.open).toHaveBeenCalledWith(method, '/users', true);
      else expect(fetchMock.mock.calls[0][1].method).toBe(method);
    });

    it.each(['string', 'params', 'form', 'blob', 'file'] as const)('passes %s bodies through unchanged', async kind => {
      const bodies = {
        string: '',
        params: new URLSearchParams({ q: 'hello world' }),
        form: new FormData(),
        blob: new Blob(['binary']),
        file: new File(['file'], 'test.txt')
      };
      const body = bodies[kind];
      const task = request('/users', { method: 'POST', transport, body });
      expect(sentBody()).toBe(body);
      expect(sentHeaders().has('content-type')).toBe(false);
      finish();
      await task;
    });

    it.each(['object', 'pairs', 'Headers'] as const)(
      'adds JSON Content-Type without modifying %s headers',
      async kind => {
        const headers: RequestOptions['headers'] =
          kind === 'object'
            ? Object.freeze({ Authorization: 'token' })
            : kind === 'pairs'
            ? [['Authorization', 'token']]
            : new Headers({ Authorization: 'token' });
        const toJSON = jest.fn(() => ({ name: 'Alice' }));
        const task = request('/users', { method: 'POST', transport, headers, json: { toJSON } });
        expect(toJSON).toHaveBeenCalledTimes(1);
        expect(sentBody()).toBe('{"name":"Alice"}');
        expect(sentHeaders().get('content-type')).toBe('application/json');
        expect(sentHeaders().get('authorization')).toBe('token');
        expect(new Headers(headers).has('content-type')).toBe(false);
        finish();
        await task;
      }
    );

    it('preserves explicit JSON media types case-insensitively', async () => {
      const task = request('/users', {
        method: 'PATCH',
        transport,
        headers: { 'cOnTeNt-TyPe': 'application/merge-patch+json' },
        json: null
      });
      expect(sentBody()).toBe('null');
      expect(sentHeaders().get('content-type')).toBe('application/merge-patch+json');
      finish();
      await task;
    });

    it.each(['json', 'text', 'blob'] as const)('reads and parses %s only once', async responseType => {
      const res = response();
      const blob = new Blob(['binary']);
      res.blob.mockResolvedValue(blob);
      fetchMock.mockResolvedValue(res);
      if (responseType === 'blob') xhr.response = blob;
      const task = request('/users', { transport, responseType });
      finish();
      const result = await task;
      expect(result.data).toEqual(responseType === 'blob' ? blob : responseType === 'text' ? '{"id":1}' : { id: 1 });
      if (transport === 'fetch') {
        expect(responseType === 'blob' ? res.blob : res.text).toHaveBeenCalledTimes(1);
        expect(responseType === 'blob' ? res.text : res.blob).not.toHaveBeenCalled();
      }
    });

    it.each([200, 201, 204, 205, 299])('accepts HTTP %s with empty JSON', async status => {
      fetchMock.mockResolvedValue(response(status, ''));
      xhr.status = status;
      xhr.response = '';
      const task = request('/users', { transport });
      finish();
      await expect(task).resolves.toMatchObject({ status, data: undefined });
    });

    it.each([200, 400, 500])('distinguishes malformed successful JSON from HTTP %s errors', async status => {
      fetchMock.mockResolvedValue(response(status, '<html>error</html>'));
      xhr.status = status;
      xhr.response = '<html>error</html>';
      const task = request('/users', { transport });
      finish();
      await expect(task).rejects.toMatchObject({
        name: 'RequestError',
        code: status === 200 ? 'RESPONSE_ERROR' : 'HTTP_ERROR',
        status,
        response: '<html>error</html>'
      });
    });

    it('preserves binary HTTP error bodies', async () => {
      const blob = new Blob(['failure']);
      const res = response(403);
      res.blob.mockResolvedValue(blob);
      fetchMock.mockResolvedValue(res);
      xhr.status = 403;
      xhr.response = blob;
      const task = request('/users', { transport, responseType: 'blob' });
      finish();
      await expect(task).rejects.toMatchObject({ code: 'HTTP_ERROR', status: 403, response: blob });
    });

    it('rejects pre-aborted signals without sending', async () => {
      const controller = new AbortController();
      controller.abort('cancelled');
      await expect(request('/users', { transport, signal: controller.signal })).rejects.toMatchObject({
        code: 'ABORTED',
        cause: 'cancelled'
      });
      expect(fetchMock).not.toHaveBeenCalled();
      expect(xhr.send).not.toHaveBeenCalled();
    });

    it('cancels pending requests and removes the signal listener', async () => {
      fetchMock.mockReturnValue(new Promise(() => {}));
      const controller = new AbortController();
      const remove = jest.spyOn(controller.signal, 'removeEventListener');
      const task = request('/users', { transport, signal: controller.signal });
      controller.abort('stop');
      await expect(task).rejects.toMatchObject({ code: 'ABORTED', cause: 'stop' });
      expect(remove).toHaveBeenCalledWith('abort', expect.any(Function));
      if (transport === 'xhr') {
        expect(xhr.abort).toHaveBeenCalledTimes(1);
        expect(xhr.onload).toBeNull();
      }
    });

    it('never retries or changes transport after a network failure', async () => {
      fetchMock.mockRejectedValue(new Error('offline'));
      const task = request('/users', { transport });
      if (transport === 'xhr') xhr.onerror!(event());
      await expect(task).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
      expect(fetchMock).toHaveBeenCalledTimes(transport === 'fetch' ? 1 : 0);
      expect(xhr.send).toHaveBeenCalledTimes(transport === 'xhr' ? 1 : 0);
    });
  });

  it.each([
    { method: 'TRACE' },
    { responseType: 'xml' },
    { transport: 'other' },
    { onProgress: true },
    { transport: 'fetch', onProgress: () => {} },
    { method: 'POST', body: 'raw', json: {} },
    { body: '' },
    { method: 'HEAD', json: null },
    { method: 'POST', body: {} },
    { method: 'POST', body: null },
    { method: 'POST', body: new Uint8Array(1) },
    { method: 'POST', json: BigInt(1) },
    { method: 'POST', json: Symbol('invalid') },
    { method: 'POST', json: () => {} }
  ])('rejects invalid options before sending: %p', async options => {
    await expect(request('/users', options as RequestOptions)).rejects.toMatchObject({
      name: 'RequestError',
      code: 'INVALID_OPTIONS',
      status: 0
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(xhr.open).not.toHaveBeenCalled();
  });

  it('rejects circular JSON through the Promise with its original cause', async () => {
    const json: { self?: unknown } = {};
    json.self = json;
    const task = request('/users', { method: 'POST', json });
    await expect(task).rejects.toMatchObject({ code: 'INVALID_OPTIONS', cause: expect.any(TypeError) });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    { 'cOnTeNt-TyPe': 'multipart/form-data' },
    [['CONTENT-TYPE', 'multipart/form-data']] as [string, string][],
    new Headers({ 'Content-Type': 'multipart/form-data' })
  ])('rejects manual multipart headers in every HeadersInit shape', async headers => {
    await expect(request('/users', { method: 'POST', body: new FormData(), headers })).rejects.toMatchObject({
      code: 'INVALID_OPTIONS',
      cause: expect.any(TypeError)
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uses XHR response progress with auto and reports completion before parsing', async () => {
    const onProgress = jest.fn();
    xhr.response = 'invalid JSON';
    const task = request('/users', { method: 'POST', json: {}, onProgress });
    expect(fetchMock).not.toHaveBeenCalled();
    xhr.onprogress!(event(3, 0));
    expect(onProgress).toHaveBeenLastCalledWith({
      loaded: 3,
      total: undefined,
      percent: undefined,
      lengthComputable: false,
      done: false
    });
    xhr.onload!(event());
    await expect(task).rejects.toMatchObject({ code: 'RESPONSE_ERROR' });
    expect(onProgress).toHaveBeenLastCalledWith(expect.objectContaining({ done: true, percent: 100 }));
    expect(xhr.onprogress).toBeNull();
    expect(xhr.onload).toBeNull();
  });

  it('preserves a progress callback exception and stops the request', async () => {
    const cause = new Error('callback');
    const task = request('/users', {
      onProgress: ({ loaded }) => {
        if (loaded) throw cause;
      }
    });
    xhr.onprogress!(event());
    await expect(task).rejects.toBe(cause);
    expect(xhr.abort).toHaveBeenCalledTimes(1);
  });

  it('falls back to XHR only when fetch is unavailable', async () => {
    Reflect.deleteProperty(globalThis, 'fetch');
    const task = request('/users');
    xhr.onload!(event());
    await expect(task).resolves.toMatchObject({ data: { id: 1 } });
  });

  it('reports unsupported environments and unavailable progress explicitly', async () => {
    Reflect.deleteProperty(globalThis, 'XMLHttpRequest');
    await expect(request('/users', { onProgress: () => {} })).rejects.toMatchObject({
      code: 'UNSUPPORTED_ENVIRONMENT'
    });
    Reflect.deleteProperty(globalThis, 'fetch');
    await expect(request('/users')).rejects.toMatchObject({ code: 'UNSUPPORTED_ENVIRONMENT' });
  });

  it.each([200, 500])('preserves status on body read failure after HTTP %s', async status => {
    const res = response(status);
    const cause = new Error('read failed');
    res.text.mockRejectedValue(cause);
    fetchMock.mockResolvedValue(res);
    await expect(request('/users')).rejects.toMatchObject({
      code: status === 200 ? 'NETWORK_ERROR' : 'HTTP_ERROR',
      status,
      cause
    });
  });

  it('prioritizes pre-cancellation before reading options, headers or serializing JSON', async () => {
    const controller = new AbortController();
    controller.abort('already cancelled');
    const readBody = jest.fn(() => {
      throw new Error('must not prepare');
    });
    await expect(
      request('/users', {
        signal: controller.signal,
        get json() {
          return readBody();
        },
        get headers() {
          return readBody();
        },
        timeout: -1
      })
    ).rejects.toMatchObject({ code: 'ABORTED', status: 0, cause: 'already cancelled' });
    expect(readBody).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(xhr.open).not.toHaveBeenCalled();
  });

  it('does not send when JSON serialization cancels the request', async () => {
    const controller = new AbortController();
    await expect(
      request('/users', {
        method: 'POST',
        signal: controller.signal,
        json: {
          toJSON: () => {
            controller.abort('during preparation');
            return {};
          }
        }
      })
    ).rejects.toMatchObject({ code: 'ABORTED', cause: 'during preparation' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  describe('credentials', () => {
    it.each(['omit', 'same-origin', 'include'] as const)(
      'forwards %s to fetch without stripping explicit authorization',
      async credentials => {
        const headers = { Authorization: 'Bearer explicit' };
        await request('/users', { credentials, headers });
        expect(fetchMock.mock.calls[0][1]).toMatchObject({ credentials, headers });
      }
    );

    it.each(['same-origin', 'include'] as const)('maps %s to XHR before sending', async credentials => {
      xhr.send.mockImplementation(() => expect(xhr.withCredentials).toBe(credentials === 'include'));
      const task = request('/users', { transport: 'xhr', credentials });
      xhr.onload!(event());
      await task;
    });

    it.each([{ transport: 'xhr' }, { onProgress: () => {} }, { transport: 'xhr', onProgress: () => {} }] as const)(
      'rejects omit with an XHR requirement before opening any request: %p',
      async options => {
        await expect(request('/users', { ...options, credentials: 'omit' })).rejects.toMatchObject({
          code: 'INVALID_OPTIONS'
        });
        expect(fetchMock).not.toHaveBeenCalled();
        expect(xhr.open).not.toHaveBeenCalled();
      }
    );

    it('never falls back to XHR for omit when fetch is unavailable', async () => {
      Reflect.deleteProperty(globalThis, 'fetch');
      await expect(request('/users', { credentials: 'omit' })).rejects.toMatchObject({
        code: 'UNSUPPORTED_ENVIRONMENT'
      });
      expect(xhr.open).not.toHaveBeenCalled();
    });

    it.each([null, true, 'false', 'anonymous'])('rejects invalid credentials %p', async credentials => {
      await expect(request('/users', { credentials } as unknown as RequestOptions)).rejects.toMatchObject({
        code: 'INVALID_OPTIONS'
      });
      expect(fetchMock).not.toHaveBeenCalled();
      expect(xhr.open).not.toHaveBeenCalled();
    });
  });

  describe('timeout', () => {
    const tick = async () => {
      for (let i = 0; i < 8; i++) await Promise.resolve();
    };
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it.each([undefined, 0])('does not allocate a timer/controller when timeout is %p', async timeout => {
      Reflect.deleteProperty(globalThis, 'AbortController');
      const schedule = jest.spyOn(globalThis, 'setTimeout');
      try {
        await request('/users', { timeout });
        expect(fetchMock.mock.calls[0][1].signal).toBeUndefined();
        expect(schedule).not.toHaveBeenCalled();
      } finally {
        schedule.mockRestore();
      }
    });

    it.each([-1, 0.5, NaN, Infinity, 2147483648, '100', null])(
      'rejects invalid timeout %p before JSON serialization',
      async timeout => {
        const toJSON = jest.fn();
        await expect(
          request('/users', { method: 'POST', json: { toJSON }, timeout } as unknown as RequestOptions)
        ).rejects.toMatchObject({ code: 'INVALID_OPTIONS' });
        expect(toJSON).not.toHaveBeenCalled();
        expect(fetchMock).not.toHaveBeenCalled();
        expect(xhr.open).not.toHaveBeenCalled();
        expect(jest.getTimerCount()).toBe(0);
      }
    );

    it('reports missing AbortController instead of starting an uncancellable timed fetch', async () => {
      Reflect.deleteProperty(globalThis, 'AbortController');
      await expect(request('/users', { timeout: 100 })).rejects.toMatchObject({ code: 'UNSUPPORTED_ENVIRONMENT' });
      expect(fetchMock).not.toHaveBeenCalled();
      expect(jest.getTimerCount()).toBe(0);
    });

    describe.each(['fetch', 'xhr'] as const)('%s', transport => {
      it.each(['headers', 'body'] as const)('aborts on timeout during %s and preserves status', async stage => {
        xhr.status = stage === 'body' ? 200 : 0;
        if (stage === 'headers') fetchMock.mockReturnValue(new Promise(() => {}));
        else {
          const res = response();
          res.text.mockReturnValue(new Promise(() => {}));
          fetchMock.mockResolvedValue(res);
        }
        const controller = new AbortController();
        const remove = jest.spyOn(controller.signal, 'removeEventListener');
        const task = request('/users', { transport, timeout: 100, signal: controller.signal });
        const rejected = expect(task).rejects.toMatchObject({ code: 'TIMEOUT', status: stage === 'body' ? 200 : 0 });
        await tick();
        jest.advanceTimersByTime(100);
        await rejected;
        expect(controller.signal.aborted).toBe(false);
        expect(remove).toHaveBeenCalledWith('abort', expect.any(Function));
        if (transport === 'fetch') {
          const signal = fetchMock.mock.calls[0][1].signal as AbortSignal;
          expect(signal.aborted).toBe(true);
          expect(signal.reason).toBeInstanceOf(RequestError);
          expect(signal.reason.code).toBe('TIMEOUT');
        } else {
          expect(xhr.abort).toHaveBeenCalledTimes(1);
          expect(xhr.onload).toBeNull();
          expect(xhr.onprogress).toBeNull();
        }
        expect(jest.getTimerCount()).toBe(0);
      });

      it('does not reset the timeout after headers or progress arrive', async () => {
        let resolveHeaders!: (res: ReturnType<typeof response>) => void;
        fetchMock.mockReturnValue(
          new Promise(resolve => {
            resolveHeaders = resolve;
          })
        );
        const task = request('/users', {
          transport,
          timeout: 100,
          onProgress: transport === 'xhr' ? () => {} : undefined
        });
        const rejected = expect(task).rejects.toMatchObject({ code: 'TIMEOUT', status: 200 });
        jest.advanceTimersByTime(75);
        const res = response();
        res.text.mockReturnValue(new Promise(() => {}));
        if (transport === 'fetch') resolveHeaders(res);
        else xhr.onprogress!(event(1, 10));
        await tick();
        jest.advanceTimersByTime(25);
        await rejected;
      });

      it.each(['abort', 'timeout'] as const)('keeps the first terminal outcome when %s happens first', async first => {
        fetchMock.mockReturnValue(new Promise(() => {}));
        const controller = new AbortController();
        const task = request('/users', { transport, timeout: 100, signal: controller.signal });
        const rejected = expect(task).rejects.toMatchObject({ code: first === 'abort' ? 'ABORTED' : 'TIMEOUT' });
        if (first === 'abort') controller.abort('user cancelled');
        jest.advanceTimersByTime(100);
        if (first === 'timeout') controller.abort('too late');
        await rejected;
        if (transport === 'fetch') {
          expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
        } else expect(xhr.abort).toHaveBeenCalledTimes(1);
        expect(jest.getTimerCount()).toBe(0);
      });

      it.each([200, 500])('cleans up after HTTP %s before the deadline and ignores later abort', async status => {
        xhr.status = status;
        fetchMock.mockResolvedValue(response(status));
        const controller = new AbortController();
        const task = request('/users', { transport, timeout: 100, signal: controller.signal });
        if (transport === 'xhr') xhr.onload!(event());
        if (status === 200) await task;
        else await expect(task).rejects.toMatchObject({ code: 'HTTP_ERROR' });
        expect(jest.getTimerCount()).toBe(0);
        controller.abort();
        jest.advanceTimersByTime(100);
        if (transport === 'fetch') expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(false);
        else expect(xhr.abort).not.toHaveBeenCalled();
      });

      it('isolates simultaneous timeouts and cancellation', async () => {
        fetchMock.mockReturnValue(new Promise(() => {}));
        const firstXHR = xhr;
        const first = request('/first', { transport, timeout: 10 });
        const firstRejected = expect(first).rejects.toMatchObject({ code: 'TIMEOUT' });
        xhr = mockXHR();
        (globalThis.XMLHttpRequest as unknown as jest.Mock).mockReturnValue(xhr);
        const controller = new AbortController();
        const second = request('/second', { transport, timeout: 100, signal: controller.signal });
        const secondRejected = expect(second).rejects.toMatchObject({ code: 'ABORTED' });
        jest.advanceTimersByTime(10);
        await firstRejected;
        if (transport === 'xhr') {
          expect(firstXHR.abort).toHaveBeenCalledTimes(1);
          expect(xhr.abort).not.toHaveBeenCalled();
        } else expect(fetchMock.mock.calls[1][1].signal.aborted).toBe(false);
        controller.abort();
        await secondRejected;
        expect(jest.getTimerCount()).toBe(0);
      });
    });

    it('clears the timer and aborts XHR when a progress callback throws', async () => {
      const cause = new Error('progress callback');
      const task = request('/users', {
        timeout: 100,
        onProgress: () => {
          throw cause;
        }
      });
      await expect(task).rejects.toBe(cause);
      expect(xhr.send).not.toHaveBeenCalled();
      expect(xhr.abort).toHaveBeenCalledTimes(1);
      expect(jest.getTimerCount()).toBe(0);
    });

    it('cleans up when XHR setup fails', async () => {
      xhr.open.mockImplementation(() => {
        throw new Error('invalid URL');
      });
      await expect(request('/users', { transport: 'xhr', timeout: 100 })).rejects.toMatchObject({
        code: 'INVALID_OPTIONS'
      });
      expect(jest.getTimerCount()).toBe(0);
    });

    it.each(['NETWORK_ERROR', 'RESPONSE_ERROR'] as const)('clears the timeout after %s on fetch', async code => {
      if (code === 'NETWORK_ERROR') fetchMock.mockRejectedValue(new Error('offline'));
      else fetchMock.mockResolvedValue(response(200, 'invalid JSON'));
      await expect(request('/users', { timeout: 100 })).rejects.toMatchObject({ code });
      expect(jest.getTimerCount()).toBe(0);
    });

    it('ignores a late fetch response after timeout without reading its body', async () => {
      let resolve!: (res: ReturnType<typeof response>) => void;
      fetchMock.mockReturnValue(
        new Promise(res => {
          resolve = res;
        })
      );
      const task = request('/users', { timeout: 100 });
      const rejected = expect(task).rejects.toMatchObject({ code: 'TIMEOUT' });
      jest.advanceTimersByTime(100);
      await rejected;
      const res = response();
      resolve(res);
      await tick();
      expect(res.text).not.toHaveBeenCalled();
      expect(res.blob).not.toHaveBeenCalled();
      expect(jest.getTimerCount()).toBe(0);
    });

    it('ignores queued XHR progress and completion after timeout', async () => {
      const onProgress = jest.fn();
      const task = request('/users', { timeout: 100, onProgress });
      const rejected = expect(task).rejects.toMatchObject({ code: 'TIMEOUT' });
      const onload = xhr.onload!;
      const progress = xhr.onprogress!;
      jest.advanceTimersByTime(100);
      await rejected;
      onProgress.mockClear();
      progress(event());
      onload(event());
      await tick();
      expect(onProgress).not.toHaveBeenCalled();
      expect(xhr.getAllResponseHeaders).not.toHaveBeenCalled();
    });
  });
});
