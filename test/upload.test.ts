import uploadModule, { upload, UploadError, UploadOptions } from '../src/upload';

const NativeBlob = Blob;
const NativeFormData = FormData;
const globals = ['fetch', 'XMLHttpRequest', 'Headers'] as const;
const setGlobal = (name: string, value: unknown) =>
  Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};
const tick = async () => {
  for (let i = 0; i < 8; i++) await Promise.resolve();
};
const progress = (loaded = 10, total = 10, lengthComputable = true) =>
  new ProgressEvent('progress', { loaded, total, lengthComputable });
const response = (status = 201, text = '{"id":"file-1"}') => ({
  status,
  headers: {
    get: jest.fn(() => 'application/json'),
    forEach: (visit: (value: string, name: string) => void) => {
      visit('application/json', 'content-type');
      visit('file-request', 'x-request-id');
    }
  },
  text: jest.fn().mockResolvedValue(text),
  blob: jest.fn().mockResolvedValue(new NativeBlob([text], { type: 'application/json' }))
});
function mockXHR() {
  return {
    status: 201,
    response: '{"id":"file-1"}' as string | Blob,
    responseType: '',
    upload: {
      onload: null as ((event: ProgressEvent) => void) | null,
      onprogress: null as ((event: ProgressEvent) => void) | null
    },
    onload: null as ((event: ProgressEvent) => void) | null,
    onprogress: null as ((event: ProgressEvent) => void) | null,
    onerror: null as ((event: ProgressEvent) => void) | null,
    onabort: null as (() => void) | null,
    open: jest.fn(),
    send: jest.fn(),
    abort: jest.fn(),
    setRequestHeader: jest.fn(),
    getResponseHeader: jest.fn(() => 'application/json'),
    getAllResponseHeaders: jest.fn(() => 'Content-Type: application/json\r\nX-Request-Id: file-request\r\n')
  };
}

describe('upload', () => {
  let descriptors: Array<PropertyDescriptor | undefined>;
  let xhr: ReturnType<typeof mockXHR>;
  let fetchMock: jest.Mock;
  let file: Blob;
  beforeEach(() => {
    descriptors = globals.map(name => Object.getOwnPropertyDescriptor(globalThis, name));
    xhr = mockXHR();
    fetchMock = jest.fn().mockResolvedValue(response());
    setGlobal('fetch', fetchMock);
    setGlobal(
      'XMLHttpRequest',
      jest.fn(() => xhr)
    );
    file = new NativeBlob(['hello'], { type: 'text/plain' });
  });
  afterEach(() => {
    globals.forEach((name, index) => {
      const descriptor = descriptors[index];
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    });
  });

  it('exports the utility and error in the module default', () => {
    expect(uploadModule.upload).toBe(upload);
    expect(uploadModule.UploadError).toBe(UploadError);
  });

  it.each([
    ['auto', false, true, 'fetch'],
    ['auto', false, false, 'xhr'],
    ['auto', true, true, 'xhr'],
    ['xhr', false, true, 'xhr'],
    ['xhr', true, true, 'xhr'],
    ['fetch', false, true, 'fetch']
  ] as const)('routes %s with progress=%s and fetch=%s to %s', async (transport, monitored, available, selected) => {
    if (!available) setGlobal('fetch', undefined);
    const onProgress = monitored ? jest.fn() : undefined;
    const task = upload('/files', file, { transport, onProgress });
    if (selected === 'xhr') {
      expect(xhr.open).toHaveBeenCalledWith('POST', '/files', true);
      expect(xhr.send).toHaveBeenCalledWith(file);
      expect(xhr.responseType).toBe('text');
      expect(Boolean(xhr.upload.onprogress)).toBe(monitored);
      expect(xhr.onprogress).toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
      xhr.onload!(progress());
    } else {
      expect(fetchMock).toHaveBeenCalledWith('/files', {
        method: 'POST',
        body: file,
        headers: undefined,
        signal: undefined
      });
      expect(xhr.send).not.toHaveBeenCalled();
    }
    const result = await task;
    expect(result).toEqual({
      status: 201,
      data: { id: 'file-1' },
      headers: { 'content-type': 'application/json', 'x-request-id': 'file-request' }
    });
    expect(xhr.onload).toBeNull();
    expect(xhr.upload.onprogress).toBeNull();
  });

  it.each(['fetch', 'xhr'] as const)(
    'sends FormData unchanged on %s, without creating a multipart header',
    async transport => {
      const form = new NativeFormData();
      form.append('files', file, 'hello.txt');
      form.append('files', file, 'second.txt');
      form.append('folderId', '123');
      const headers = { Authorization: 'Bearer test' };
      const task = upload('/files', form, { transport, headers });
      if (transport === 'xhr') {
        expect(xhr.send).toHaveBeenCalledWith(form);
        expect(xhr.setRequestHeader.mock.calls).toEqual([['Authorization', 'Bearer test']]);
        xhr.onload!(progress());
      } else {
        expect(fetchMock.mock.calls[0][1].body).toBe(form);
        expect(fetchMock.mock.calls[0][1].headers).toBe(headers);
      }
      await task;
      expect(form.getAll('files')).toHaveLength(2);
    }
  );

  it.each(['fetch', 'xhr'] as const)('supports PUT with a File and explicit content type on %s', async transport => {
    const body = new File(['file'], 'data.txt', { type: 'text/plain' });
    const task = upload('/storage', body, { transport, method: 'PUT', headers: { 'Content-Type': 'text/plain' } });
    if (transport === 'xhr') {
      expect(xhr.open).toHaveBeenCalledWith('PUT', '/storage', true);
      expect(xhr.send).toHaveBeenCalledWith(body);
      xhr.onload!(progress());
    } else {
      expect(fetchMock.mock.calls[0][1].method).toBe('PUT');
      expect(fetchMock.mock.calls[0][1].body).toBe(body);
    }
    await task;
  });

  it.each(['object', 'pairs', 'Headers'] as const)(
    'rejects manual FormData Content-Type supplied as %s before sending',
    async shape => {
      const NativeHeaders = require('node:vm').runInThisContext('Headers') as typeof Headers;
      const headers: UploadOptions['headers'] =
        shape === 'object'
          ? { 'cOnTeNt-TyPe': 'multipart/form-data' }
          : shape === 'pairs'
          ? [['CONTENT-TYPE', 'multipart/form-data']]
          : new NativeHeaders({ 'Content-Type': 'multipart/form-data' });
      for (const transport of ['fetch', 'xhr'] as const) {
        await expect(upload('/files', new NativeFormData(), { transport, headers })).rejects.toMatchObject({
          code: 'INVALID_OPTIONS'
        });
      }
      expect(fetchMock).not.toHaveBeenCalled();
      expect(xhr.send).not.toHaveBeenCalled();
    }
  );

  it.each([
    { method: 'GET' },
    { responseType: 'xml' },
    { transport: 'invalid' },
    { onProgress: true },
    { transport: 'fetch', onProgress: () => {} }
  ])('rejects invalid options before sending: %p', async options => {
    await expect(upload('/files', file, options as UploadOptions)).rejects.toMatchObject({ code: 'INVALID_OPTIONS' });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(xhr.open).not.toHaveBeenCalled();
  });

  it.each([null, 'text', {}, new Uint8Array(2)])('rejects unsupported request body %p', async body => {
    await expect(upload('/files', body as Blob)).rejects.toMatchObject({ code: 'INVALID_OPTIONS' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['fetch', 'xhr', 'progress'] as const)('rejects unavailable %s without losing progress', async missing => {
    setGlobal(missing === 'fetch' ? 'fetch' : 'XMLHttpRequest', undefined);
    await expect(
      upload('/files', file, {
        transport: missing === 'progress' ? 'auto' : missing,
        onProgress: missing === 'progress' ? jest.fn() : undefined
      })
    ).rejects.toMatchObject({ code: 'UNSUPPORTED_ENVIRONMENT' });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(xhr.send).not.toHaveBeenCalled();
  });

  it.each(['fetch', 'xhr'] as const)('accepts all 2xx and returns empty 204/205 results on %s', async transport => {
    for (const status of [200, 201, 202, 204, 205, 299]) {
      fetchMock.mockResolvedValueOnce(response(status, ''));
      xhr = mockXHR();
      (globalThis.XMLHttpRequest as unknown as jest.Mock).mockReturnValue(xhr);
      xhr.status = status;
      xhr.response = '';
      const task = upload('/files', file, { transport });
      if (transport === 'xhr') xhr.onload!(progress());
      await expect(task).resolves.toMatchObject({ status, data: undefined });
    }
  });

  it.each(['fetch', 'xhr'] as const)('parses JSON, text and binary responses on %s', async transport => {
    for (const responseType of ['json', 'text', 'blob'] as const) {
      const res = response();
      fetchMock.mockResolvedValueOnce(res);
      xhr = mockXHR();
      (globalThis.XMLHttpRequest as unknown as jest.Mock).mockReturnValue(xhr);
      const blob = new NativeBlob(['binary']);
      if (responseType === 'blob') {
        xhr.response = blob;
        res.blob.mockResolvedValueOnce(blob);
      }
      const task = upload('/files', file, { transport, responseType });
      if (transport === 'xhr') xhr.onload!(progress());
      const result = await task;
      if (responseType === 'blob') expect(result.data).toBe(blob);
      else expect(result.data).toEqual(responseType === 'json' ? { id: 'file-1' } : '{"id":"file-1"}');
      if (transport === 'fetch') {
        expect(responseType === 'blob' ? res.text : res.blob).not.toHaveBeenCalled();
      }
    }
  });

  it.each(['fetch', 'xhr'] as const)(
    'rejects malformed successful JSON while preserving its body on %s',
    async transport => {
      fetchMock.mockResolvedValue(response(200, '<html>not json</html>'));
      xhr.status = 200;
      xhr.response = '<html>not json</html>';
      const task = upload('/files', file, { transport });
      if (transport === 'xhr') xhr.onload!(progress());
      await expect(task).rejects.toMatchObject({
        status: 200,
        code: 'RESPONSE_ERROR',
        response: '<html>not json</html>',
        cause: expect.any(SyntaxError)
      });
    }
  );

  it.each(['fetch', 'xhr'] as const)('preserves HTTP status and raw error body on %s', async transport => {
    fetchMock.mockResolvedValue(response(413, 'too large'));
    xhr.status = 413;
    xhr.response = 'too large';
    const task = upload('/files', file, { transport });
    if (transport === 'xhr') xhr.onload!(progress());
    await expect(task).rejects.toMatchObject({ code: 'HTTP_ERROR', status: 413, response: 'too large' });
  });

  it('retains error bodies as Blob when requested', async () => {
    const res = response(500);
    const blob = new NativeBlob(['failure']);
    res.blob.mockResolvedValue(blob);
    fetchMock.mockResolvedValue(res);
    const error = await upload('/files', file, { responseType: 'blob' }).catch(error => error);
    expect(error).toBeInstanceOf(UploadError);
    expect(error.response).toBe(blob);
  });

  it.each([201, 500])('handles fetch body read failure after HTTP %s', async status => {
    const cause = new Error('body read failed');
    const res = response(status);
    res.text.mockRejectedValue(cause);
    fetchMock.mockResolvedValue(res);
    await expect(upload('/files', file)).rejects.toMatchObject({
      code: status === 201 ? 'NETWORK_ERROR' : 'HTTP_ERROR',
      status,
      cause
    });
    expect(xhr.send).not.toHaveBeenCalled();
  });

  it.each(['fetch', 'xhr'] as const)('never retries or changes transport on %s failure', async transport => {
    fetchMock.mockRejectedValue(new Error('offline'));
    const task = upload('/files', file, { transport });
    if (transport === 'xhr') {
      const error = xhr.onerror!;
      error(progress());
      error(progress());
    }
    await expect(task).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
    expect(fetchMock).toHaveBeenCalledTimes(transport === 'fetch' ? 1 : 0);
    expect(xhr.send).toHaveBeenCalledTimes(transport === 'xhr' ? 1 : 0);
  });

  it('registers upload progress before open and waits for server acknowledgement', async () => {
    const onProgress = jest.fn();
    xhr.open.mockImplementation(() => expect(xhr.upload.onprogress).toEqual(expect.any(Function)));
    const resolved = jest.fn();
    const task = upload('/files', file, { onProgress }).then(resolved);
    expect(onProgress).toHaveBeenLastCalledWith({
      loaded: 0,
      total: undefined,
      percent: undefined,
      lengthComputable: false,
      done: false
    });
    xhr.upload.onprogress!(progress(5, 10));
    expect(onProgress).toHaveBeenLastCalledWith({
      loaded: 5,
      total: 10,
      percent: 50,
      lengthComputable: true,
      done: false
    });
    xhr.upload.onload!(progress());
    xhr.upload.onload!(progress());
    xhr.upload.onprogress!(progress());
    await tick();
    expect(resolved).not.toHaveBeenCalled();
    expect(onProgress.mock.calls.filter(([p]) => p.done)).toHaveLength(1);
    xhr.onload!(progress());
    await task;
    expect(resolved).toHaveBeenCalledTimes(1);
    expect(xhr.upload.onload).toBeNull();
    expect(xhr.upload.onprogress).toBeNull();
  });

  it('rejects when the server fails after upload progress is complete', async () => {
    const onProgress = jest.fn();
    const task = upload('/files', file, { onProgress });
    xhr.upload.onload!(progress());
    xhr.status = 500;
    xhr.response = 'storage failed';
    xhr.onload!(progress());
    await expect(task).rejects.toMatchObject({ code: 'HTTP_ERROR', status: 500 });
    expect(onProgress).toHaveBeenLastCalledWith(expect.objectContaining({ done: true }));
  });

  it.each([
    [0, 0, false],
    [0, 0, true],
    [5, 0, false],
    [20, 10, true]
  ] as const)('handles native progress %s/%s', async (loaded, total, computable) => {
    const onProgress = jest.fn();
    const task = upload('/files', file, { onProgress });
    xhr.upload.onprogress!(progress(loaded, total, computable));
    expect(onProgress).toHaveBeenLastCalledWith(
      expect.objectContaining({ loaded, percent: total > 0 ? 100 : undefined, lengthComputable: total > 0 })
    );
    xhr.upload.onload!(progress(loaded, total, computable));
    xhr.onload!(progress());
    await task;
  });

  it.each(['initial', 'progress', 'done'] as const)(
    'aborts and rejects original exception from %s progress callback',
    async phase => {
      const cause = new Error('UI failed');
      const task = upload('/files', file, {
        onProgress(p) {
          if (phase === 'initial' || (phase === 'progress' && p.loaded > 0) || (phase === 'done' && p.done))
            throw cause;
        }
      });
      if (phase === 'progress') xhr.upload.onprogress!(progress(2, 10));
      if (phase === 'done') xhr.upload.onload!(progress());
      await expect(task).rejects.toBe(cause);
      expect(xhr.abort).toHaveBeenCalledTimes(1);
      expect(xhr.upload.onprogress).toBeNull();
      if (phase === 'initial') expect(xhr.send).not.toHaveBeenCalled();
    }
  );

  it.each(['fetch', 'xhr'] as const)('does not send a pre-cancelled %s request', async transport => {
    const controller = new AbortController();
    controller.abort('stop');
    await expect(upload('/files', file, { transport, signal: controller.signal })).rejects.toMatchObject({
      code: 'ABORTED',
      status: 0,
      cause: 'stop'
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(xhr.send).not.toHaveBeenCalled();
  });

  it.each(['during', 'after'] as const)('can cancel %s request body upload', async phase => {
    const controller = new AbortController();
    const removed = jest.spyOn(controller.signal, 'removeEventListener');
    xhr.status = 0;
    const task = upload('/files', file, { onProgress: jest.fn(), signal: controller.signal });
    const lateLoad = xhr.onload!;
    if (phase === 'after') xhr.upload.onload!(progress());
    else xhr.upload.onprogress!(progress(5, 10));
    controller.abort('cancel');
    await expect(task).rejects.toMatchObject({ code: 'ABORTED', cause: 'cancel' });
    lateLoad(progress());
    expect(xhr.abort).toHaveBeenCalledTimes(1);
    expect(xhr.onload).toBeNull();
    expect(xhr.upload.onload).toBeNull();
    expect(xhr.upload.onprogress).toBeNull();
    expect(removed).toHaveBeenCalledWith('abort', expect.any(Function));
  });

  it('cancels fetch while reading the response and ignores late completion', async () => {
    const pending = deferred<string>();
    const res = response();
    res.text.mockReturnValue(pending.promise);
    fetchMock.mockResolvedValue(res);
    const controller = new AbortController();
    const task = upload('/files', file, { signal: controller.signal });
    await tick();
    controller.abort();
    await expect(task).rejects.toMatchObject({ code: 'ABORTED', status: 201 });
    pending.resolve('{}');
    await tick();
    expect(fetchMock.mock.calls[0][1].signal).toBe(controller.signal);
  });

  it('cancels from the upload completion callback before accepting a response', async () => {
    const controller = new AbortController();
    const task = upload('/files', file, {
      signal: controller.signal,
      onProgress(p) {
        if (p.done) controller.abort();
      }
    });
    xhr.upload.onload!(progress());
    await expect(task).rejects.toMatchObject({ code: 'ABORTED' });
    expect(xhr.onload).toBeNull();
  });

  it('removes listeners on success; later cancellation does not abort the completed upload', async () => {
    const controller = new AbortController();
    const remove = jest.spyOn(controller.signal, 'removeEventListener');
    const task = upload('/files', file, { signal: controller.signal, onProgress: jest.fn() });
    xhr.upload.onload!(progress());
    xhr.onload!(progress());
    await task;
    controller.abort();
    expect(xhr.abort).not.toHaveBeenCalled();
    expect(remove).toHaveBeenCalledWith('abort', expect.any(Function));
  });

  it('isolates concurrent requests when one upload is cancelled', async () => {
    const first = mockXHR();
    const second = mockXHR();
    (globalThis.XMLHttpRequest as unknown as jest.Mock)
      .mockImplementationOnce(() => first)
      .mockImplementationOnce(() => second);
    const controller = new AbortController();
    const firstProgress = jest.fn();
    const secondProgress = jest.fn();
    const cancelled = upload('/first', file, { onProgress: firstProgress, signal: controller.signal });
    const successful = upload('/second', file, { onProgress: secondProgress });
    controller.abort();
    await expect(cancelled).rejects.toMatchObject({ code: 'ABORTED' });
    second.upload.onload!(progress());
    second.onload!(progress());
    await expect(successful).resolves.toMatchObject({ status: 201 });
    expect(first.abort).toHaveBeenCalledTimes(1);
    expect(second.abort).not.toHaveBeenCalled();
    expect(firstProgress).toHaveBeenCalledTimes(1);
    expect(secondProgress).toHaveBeenCalledTimes(2);
  });

  it('preserves response headers safely including duplicate names and prototype keys', async () => {
    xhr.getAllResponseHeaders.mockReturnValue('X-Value: a\r\nx-value: b\r\n__proto__: safe\r\nmalformed\r\n');
    const task = upload('/files', file, { transport: 'xhr' });
    xhr.onload!(progress());
    const result = await task;
    expect(result.headers['x-value']).toBe('a, b');
    expect(Object.getOwnPropertyDescriptor(result.headers, '__proto__')?.value).toBe('safe');
    expect(Object.getPrototypeOf(result.headers)).toBeNull();
  });

  it('works without global Headers when using plain header objects with XHR', async () => {
    setGlobal('Headers', undefined);
    const task = upload('/files', file, { transport: 'xhr', headers: { Authorization: 'Bearer test' } });
    xhr.onload!(progress());
    await task;
    expect(xhr.setRequestHeader).toHaveBeenCalledWith('Authorization', 'Bearer test');
  });

  it('cleans handlers and rejects if XHR setup or send fails', async () => {
    xhr.setRequestHeader.mockImplementationOnce(() => {
      throw new Error('invalid header');
    });
    await expect(
      upload('/files', file, { transport: 'xhr', onProgress: jest.fn(), headers: { x: 'y' } })
    ).rejects.toMatchObject({ code: 'INVALID_OPTIONS' });
    expect(xhr.upload.onload).toBeNull();
    expect(xhr.send).not.toHaveBeenCalled();
    xhr.send.mockImplementationOnce(() => {
      throw new Error('send');
    });
    await expect(upload('/files', file, { transport: 'xhr' })).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
    expect(xhr.onload).toBeNull();
  });
});
