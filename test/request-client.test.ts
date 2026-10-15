/** @jest-environment node */
import requestModule, { createRequestClient, RequestClientOptions, RequestError } from '../src/request';
import sculp, { createRequestClient as rootCreate } from '../src/index';
import core, { createRequestClient as coreCreate } from '../src/core-index';

const baseURL = 'https://api.example.com/v1/';
const response = () => new Response('{"id":1}', { headers: { 'Content-Type': 'application/json' } });

describe('request clients', () => {
  let fetchMock: jest.SpyInstance;
  beforeEach(() => {
    fetchMock = jest.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.resolve(response()));
  });
  afterEach(() => {
    fetchMock.mockRestore();
    jest.useRealTimers();
  });

  it('exports the factory from root, core and the request submodule', () => {
    for (const factory of [
      rootCreate,
      coreCreate,
      sculp.createRequestClient,
      core.createRequestClient,
      requestModule.createRequestClient
    ]) {
      expect(factory).toBe(createRequestClient);
    }
  });

  it('returns a frozen client whose request method can be detached', async () => {
    const client = createRequestClient({ baseURL });
    expect(Object.isFrozen(client)).toBe(true);
    const { request } = client;
    await expect(request('users')).resolves.toMatchObject({ data: { id: 1 } });
    expect(fetchMock.mock.calls[0][0]).toBe(baseURL + 'users');
  });

  it.each([
    ['users', 'https://api.example.com/v1/users'],
    ['/users', 'https://api.example.com/v1/users'],
    ['../users', 'https://api.example.com/users'],
    ['?page=1', 'https://api.example.com/v1/?page=1'],
    ['https://API.example.com:443/users', 'https://api.example.com/users'],
    ['//api.example.com/users', 'https://api.example.com/users'],
    ['', baseURL]
  ])('resolves %s using base-prefix semantics', async (path, expected) => {
    await createRequestClient({ baseURL }).request(path);
    expect(fetchMock.mock.calls[0][0]).toBe(expected);
  });

  it('treats base paths as prefixes with or without a trailing slash', async () => {
    await createRequestClient({ baseURL: 'https://api.example.com/v1' }).request('users');
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.example.com/v1/users');
  });

  it.each([
    '/relative',
    'ftp://api.example.com/',
    'data:text/plain,hello',
    'https://user:password@api.example.com/',
    'invalid'
  ])('rejects invalid baseURL %s synchronously', baseURL => {
    expect(() => createRequestClient({ baseURL })).toThrow(RequestError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    { timeout: -1 },
    { timeout: Infinity },
    { timeout: 0.1 },
    { timeout: 2147483648 },
    { credentials: 'invalid' },
    { transport: 'invalid' },
    { credentials: 'omit', transport: 'xhr' },
    { getHeaders: true },
    { headers: { 'bad name': 'value' } },
    { headers: { Authorization: 'bad\r\nheader' } }
  ])('validates fixed configuration once: %p', options => {
    expect(() => createRequestClient({ baseURL, ...options } as RequestClientOptions)).toThrow(RequestError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    'https://api.example.com@other.example.com/',
    'https://user:pass@api.example.com/',
    // eslint-disable-next-line no-script-url -- Negative test input; never executed or sent.
    'javascript:alert(1)',
    'https:missing-slashes',
    'ftp://api.example.com/'
  ])('rejects target %s before evaluating credentials', async path => {
    const getHeaders = jest.fn(() => ({ Authorization: 'secret' }));
    const client = createRequestClient({ baseURL, getHeaders });
    await expect(client.request(path)).rejects.toMatchObject({ code: 'INVALID_OPTIONS' });
    expect(getHeaders).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['object', 'pairs', 'Headers'] as const)('snapshots %s headers and scalar defaults', async shape => {
    const headers =
      shape === 'object'
        ? { Authorization: 'original' }
        : shape === 'pairs'
        ? ([['Authorization', 'original']] as [string, string][])
        : new Headers({ Authorization: 'original' });
    const options: RequestClientOptions = { baseURL, headers, credentials: 'omit', timeout: 0 };
    const client = createRequestClient(options);
    if (headers instanceof Headers) headers.set('Authorization', 'changed');
    else if (Array.isArray(headers)) headers[0][1] = 'changed';
    else headers.Authorization = 'changed';
    options.baseURL = 'https://other.example.com/';
    options.credentials = 'include';
    await client.request('users');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(baseURL + 'users');
    expect(new Headers(init.headers).get('authorization')).toBe('original');
    expect(init.credentials).toBe('omit');
  });

  it.each(['https://other.example.com/users', 'http://api.example.com/users', 'https://api.example.com:444/users'])(
    'allows absolute target %s and preserves configured headers',
    async url => {
      const getHeaders = jest.fn(() => ({ Authorization: 'dynamic' }));
      const client = createRequestClient({ baseURL, getHeaders });
      await client.request(url);
      expect(fetchMock.mock.calls[0][0]).toBe(url);
      expect(new Headers(fetchMock.mock.calls[0][1].headers).get('authorization')).toBe('dynamic');
      expect(getHeaders).toHaveBeenCalledTimes(1);
    }
  );

  it('overrides the base for one request without changing concurrent or later requests', async () => {
    const client = createRequestClient({ baseURL });
    await Promise.all([
      client.request('/users', { baseURL: 'https://other.example.com/v2' }),
      client.request('users'),
      client.request('https://third.example.com/users', { baseURL: 'https://other.example.com/v2/' })
    ]);
    await client.request('later', { baseURL: undefined });
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'https://other.example.com/v2/users',
      baseURL + 'users',
      'https://third.example.com/users',
      baseURL + 'later'
    ]);
    expect(fetchMock.mock.calls.every(([, init]) => !('baseURL' in init))).toBe(true);
  });

  it('uses the effective base protocol for protocol-relative addresses', async () => {
    const client = createRequestClient({ baseURL });
    await client.request('//other.example.com/users');
    await client.request('//third.example.com/users', { baseURL: 'http://another.example.com/' });
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'https://other.example.com/users',
      'http://third.example.com/users'
    ]);
  });

  it.each(['/relative', '', 'ftp://other.example.com/', 'https://user:pass@other.example.com/'])(
    'rejects invalid base override %s before reading dynamic headers',
    async override => {
      const getHeaders = jest.fn();
      const client = createRequestClient({ baseURL, getHeaders });
      await expect(client.request('users', { baseURL: override })).rejects.toMatchObject({ code: 'INVALID_OPTIONS' });
      expect(getHeaders).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );

  it('gives absolute URLs precedence over an unused base override', async () => {
    await createRequestClient({ baseURL }).request('https://other.example.com/users', { baseURL: '/unused' });
    expect(fetchMock.mock.calls[0][0]).toBe('https://other.example.com/users');
  });

  it('can omit inherited authorization when targeting another service', async () => {
    const client = createRequestClient({
      baseURL,
      headers: { Authorization: 'static' },
      getHeaders: () => ({ authorization: 'dynamic' })
    });
    await client.request('https://other.example.com/users', { omitHeaders: ['Authorization'] });
    expect(new Headers(fetchMock.mock.calls[0][1].headers).has('authorization')).toBe(false);
  });

  it('merges headers case-insensitively then deletes requested names without mutating inputs', async () => {
    const defaults = Object.freeze({ Authorization: 'default', 'X-Static': 'static' });
    const dynamic = Object.freeze({ AUTHORIZATION: 'dynamic', 'X-Dynamic': 'dynamic' });
    const headers = Object.freeze({ authorization: 'call', 'X-Call': 'call' });
    const getHeaders = jest.fn(() => dynamic);
    const client = createRequestClient({ baseURL, headers: defaults, getHeaders });
    await client.request('users', { headers, omitHeaders: ['X-STATIC', 'x-dynamic'] });
    expect(Object.fromEntries(new Headers(fetchMock.mock.calls[0][1].headers))).toEqual({
      authorization: 'call',
      'x-call': 'call'
    });
    await client.request('users');
    expect(new Headers(fetchMock.mock.calls[1][1].headers).get('authorization')).toBe('dynamic');
    expect(getHeaders).toHaveBeenCalledTimes(2);
  });

  it('replaces duplicate header names rather than joining authorization tokens', async () => {
    const client = createRequestClient({
      baseURL,
      headers: [
        ['Authorization', 'first'],
        ['authorization', 'second']
      ]
    });
    await client.request('users');
    expect(new Headers(fetchMock.mock.calls[0][1].headers).get('authorization')).toBe('second');
  });

  it('reads changing tokens once per request and does not share state across clients', async () => {
    let token = 'first';
    const getHeaders = jest.fn(() => ({ Authorization: token }));
    const first = createRequestClient({ baseURL, getHeaders });
    const second = createRequestClient({ baseURL: 'https://other.example.com/', headers: { Authorization: 'other' } });
    const a = first.request('a');
    token = 'second';
    const b = first.request('b');
    const c = second.request('c');
    await Promise.all([a, b, c]);
    expect(fetchMock.mock.calls.map(([, init]) => new Headers(init.headers).get('authorization'))).toEqual([
      'first',
      'second',
      'other'
    ]);
    expect(getHeaders).toHaveBeenCalledTimes(2);
  });

  it('inherits undefined defaults and allows timeout zero and credential overrides', async () => {
    jest.useFakeTimers();
    const client = createRequestClient({ baseURL, credentials: 'omit', timeout: 100, transport: 'fetch' });
    await client.request('users', { timeout: 0, credentials: 'include' });
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ credentials: 'include', signal: undefined });
    const task = client.request('users', { timeout: undefined, credentials: undefined, transport: undefined });
    expect(fetchMock.mock.calls[1][1].credentials).toBe('omit');
    expect(fetchMock.mock.calls[1][1].signal).toBeInstanceOf(AbortSignal);
    expect(jest.getTimerCount()).toBe(1);
    await task;
    expect(jest.getTimerCount()).toBe(0);
  });

  it('rejects merged credential/progress conflicts through the existing request validation', async () => {
    const client = createRequestClient({ baseURL, credentials: 'omit' });
    await expect(client.request('users', { onProgress: () => {} })).rejects.toMatchObject({ code: 'INVALID_OPTIONS' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('checks pre-cancellation before URL resolution, dynamic headers or option getters', async () => {
    const getHeaders = jest.fn();
    const client = createRequestClient({ baseURL, getHeaders });
    const controller = new AbortController();
    controller.abort('stop');
    const read = jest.fn(() => {
      throw new Error('must not read');
    });
    await expect(
      client.request('https://other.example.com/', {
        signal: controller.signal,
        get headers() {
          return read();
        }
      })
    ).rejects.toMatchObject({ code: 'ABORTED', cause: 'stop' });
    expect(read).not.toHaveBeenCalled();
    expect(getHeaders).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not send when the dynamic header provider cancels', async () => {
    const controller = new AbortController();
    const client = createRequestClient({
      baseURL,
      getHeaders: () => {
        controller.abort();
        return {};
      }
    });
    await expect(client.request('users', { signal: controller.signal })).rejects.toMatchObject({ code: 'ABORTED' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('retains the original provider exception as cause', async () => {
    const cause = new Error('token unavailable');
    const client = createRequestClient({
      baseURL,
      getHeaders: () => {
        throw cause;
      }
    });
    await expect(client.request('users')).rejects.toMatchObject({ code: 'INVALID_OPTIONS', cause });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects accidental async providers, including rejected Promises', async () => {
    for (const getHeaders of [
      () => Promise.resolve({ Authorization: 'token' }),
      () => Promise.reject(new Error('async failure'))
    ]) {
      const client = createRequestClient({ baseURL, getHeaders } as unknown as RequestClientOptions);
      await expect(client.request('users')).rejects.toMatchObject({ code: 'INVALID_OPTIONS' });
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not clone or serialize a raw body and serializes JSON once', async () => {
    const client = createRequestClient({ baseURL });
    const body = new Blob(['raw']);
    await client.request('users', { method: 'POST', body });
    expect(fetchMock.mock.calls[0][1].body).toBe(body);
    const toJSON = jest.fn(() => ({ id: 1 }));
    await client.request('users', { method: 'POST', json: { toJSON } });
    expect(toJSON).toHaveBeenCalledTimes(1);
  });

  it.each([
    { headers: [['Authorization', 'token', 'extra']] },
    { headers: { 'bad name': 'value' } },
    { headers: { Authorization: 'token\0' } },
    { headers: { Authorization: '中文' } },
    { omitHeaders: 'Authorization' },
    { omitHeaders: ['bad name'] }
  ])('rejects invalid per-call header configuration without sending: %p', async options => {
    const client = createRequestClient({ baseURL });
    await expect(client.request('users', options as never)).rejects.toMatchObject({ code: 'INVALID_OPTIONS' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('can remove a default content type to send FormData or use automatic JSON content type', async () => {
    const client = createRequestClient({ baseURL, headers: { 'Content-Type': 'text/plain' } });
    await expect(client.request('users', { method: 'POST', body: new FormData() })).rejects.toMatchObject({
      code: 'INVALID_OPTIONS'
    });
    await client.request('users', { method: 'POST', body: new FormData(), omitHeaders: ['content-type'] });
    expect(new Headers(fetchMock.mock.calls[0][1].headers).has('content-type')).toBe(false);
    await client.request('users', { method: 'POST', json: {}, omitHeaders: ['content-type'] });
    expect(new Headers(fetchMock.mock.calls[1][1].headers).get('content-type')).toBe('application/json');
  });

  it('keeps timeout and cancellation state per request', async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementation(() => new Promise(() => {}));
    const client = createRequestClient({ baseURL, timeout: 100 });
    const controller = new AbortController();
    const first = client.request('first', { signal: controller.signal });
    const second = client.request('second');
    const firstRejected = expect(first).rejects.toMatchObject({ code: 'ABORTED' });
    const secondRejected = expect(second).rejects.toMatchObject({ code: 'TIMEOUT' });
    controller.abort();
    expect(fetchMock.mock.calls[1][1].signal.aborted).toBe(false);
    jest.advanceTimersByTime(100);
    await Promise.all([firstRejected, secondRejected]);
    expect(jest.getTimerCount()).toBe(0);
  });
});
