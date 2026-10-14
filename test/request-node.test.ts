/** @jest-environment node */
import { createServer } from 'node:http';
import { AddressInfo } from 'node:net';
import { request } from '../src/request';

describe('request with native fetch', () => {
  const server = createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    res.setHeader('X-Request-Id', 'native');
    if (req.url === '/empty') {
      res.writeHead(204);
      res.end();
    } else if (req.url === '/error') {
      res.writeHead(422, { 'Content-Type': 'application/json' });
      res.end('{"error":"invalid"}');
    } else if (req.url === '/text') {
      res.end('hello');
    } else if (req.url === '/wait') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.flushHeaders();
      res.write('{');
    } else if (req.url === '/wait-headers') {
      // Leave the connection open until the client's deadline cancels it.
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          method: req.method,
          body: Buffer.concat(chunks).toString(),
          contentType: req.headers['content-type']
        })
      );
    }
  });
  let base: string;
  beforeAll(async () => {
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(error => (error ? reject(error) : resolve())));
  });

  it('sends JSON with the chosen method and returns headers', async () => {
    const result = await request(`${base}/echo`, { method: 'PATCH', json: { name: '测试' } });
    expect(result.data).toEqual({ method: 'PATCH', body: '{"name":"测试"}', contentType: 'application/json' });
    expect(result.headers['x-request-id']).toBe('native');
  });

  it('lets native fetch encode URLSearchParams', async () => {
    const result = await request(`${base}/echo`, {
      method: 'POST',
      body: new URLSearchParams({ q: 'a b&c' })
    });
    expect(result.data).toEqual({
      method: 'POST',
      body: 'q=a+b%26c',
      contentType: 'application/x-www-form-urlencoded;charset=UTF-8'
    });
  });

  it('lets native fetch generate multipart boundaries', async () => {
    const form = new FormData();
    form.append('name', 'Alice');
    const result = await request<{ body: string; contentType: string }>(`${base}/echo`, { method: 'POST', body: form });
    expect(result.data?.contentType).toMatch(/^multipart\/form-data; boundary=/);
    expect(result.data?.body).toContain('name="name"');
    expect(result.data?.body).toContain('Alice');
  });

  it('handles HEAD and 204 without parsing empty JSON', async () => {
    await expect(request(`${base}/echo`, { method: 'HEAD' })).resolves.toMatchObject({ status: 200, data: undefined });
    await expect(request(`${base}/empty`)).resolves.toMatchObject({ status: 204, data: undefined });
  });

  it('returns real text and binary responses', async () => {
    await expect(request(`${base}/text`, { responseType: 'text' })).resolves.toMatchObject({ data: 'hello' });
    const result = await request(`${base}/text`, { responseType: 'blob' });
    expect(await result.data?.text()).toBe('hello');
  });

  it('retains a real HTTP error response', async () => {
    await expect(request(`${base}/error`)).rejects.toMatchObject({
      code: 'HTTP_ERROR',
      status: 422,
      response: '{"error":"invalid"}'
    });
  });

  it('cancels while the native response body is still being read', async () => {
    const controller = new AbortController();
    const nativeFetch = globalThis.fetch;
    const spy = jest.spyOn(globalThis, 'fetch').mockImplementation(async (...args) => {
      const response = await nativeFetch(...args);
      setImmediate(() => controller.abort('stop reading'));
      return response;
    });
    try {
      await expect(request(`${base}/wait`, { signal: controller.signal })).rejects.toMatchObject({
        code: 'ABORTED',
        status: 200,
        cause: 'stop reading'
      });
    } finally {
      spy.mockRestore();
    }
  });

  it.each(['/wait-headers', '/wait'])('timeout aborts the real connection for %s', async path => {
    const closed = new Promise<void>(resolve => {
      server.once('request', (_req, res) => res.once('close', resolve));
    });
    const controller = new AbortController();
    await expect(request(`${base}${path}`, { timeout: 250, signal: controller.signal })).rejects.toMatchObject({
      code: 'TIMEOUT',
      status: path === '/wait' ? 200 : 0
    });
    await closed;
    expect(controller.signal.aborted).toBe(false);
  });
});
