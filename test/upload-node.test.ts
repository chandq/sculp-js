/** @jest-environment node */
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { AddressInfo } from 'node:net';
import sculp, { upload as rootUpload, UploadError as RootUploadError } from '../src/index';
import uploadModule, { upload, UploadError } from '../src/upload';

// Native fetch/FormData integration also verifies that uploading never depends on the DOM.
describe('upload without a DOM', () => {
  const requests: Array<{ url: string; body: Buffer; contentType?: string }> = [];
  const server = createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on('data', (chunk: Buffer) => chunks.push(chunk));
    request.on('end', () => {
      const body = Buffer.concat(chunks);
      requests.push({ url: request.url!, body, contentType: request.headers['content-type'] });
      response.setHeader('X-Request-Id', 'native-fetch');
      if (request.url === '/error') {
        response.writeHead(409, { 'Content-Type': 'application/json' });
        response.end('{"error":"conflict"}');
      } else if (request.url === '/empty') {
        response.writeHead(204);
        response.end();
      } else {
        response.writeHead(201, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ bytes: body.length, sha256: createHash('sha256').update(body).digest('hex') }));
      }
    });
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

  it('exports identical public APIs from the root and submodule', () => {
    expect(typeof document).toBe('undefined');
    expect(rootUpload).toBe(upload);
    expect(RootUploadError).toBe(UploadError);
    expect(sculp.upload).toBe(upload);
    expect(sculp.UploadError).toBe(UploadError);
    expect(uploadModule.upload).toBe(upload);
  });

  it('sends a real Blob using native fetch and returns typed JSON', async () => {
    const bytes = Buffer.alloc(1024 * 1024, 97);
    const result = await upload<{ bytes: number; sha256: string }>(`${base}/put`, new Blob([bytes]), { method: 'PUT' });
    expect(result.status).toBe(201);
    expect(result.data?.bytes).toBe(bytes.length);
    expect(result.data?.sha256).toBe(createHash('sha256').update(bytes).digest('hex'));
    expect(requests.at(-1)?.body.equals(bytes)).toBe(true);
    expect(result.headers['x-request-id']).toBe('native-fetch');
  });

  it('lets native FormData set the multipart boundary', async () => {
    const form = new FormData();
    form.append('file', new Blob(['contents']), 'test.txt');
    form.append('folder', '123');
    await upload(`${base}/multipart`, form);
    const received = requests.at(-1)!;
    expect(received.contentType).toMatch(/^multipart\/form-data; boundary=/);
    expect(received.body.toString()).toContain('filename="test.txt"');
    expect(received.body.toString()).toContain('name="folder"');
  });

  it('accepts an actual empty 204 response with default JSON parsing', async () => {
    const result = await upload(`${base}/empty`, new Blob());
    expect(result.status).toBe(204);
    expect(result.data).toBeUndefined();
  });

  it('rejects a real HTTP error and preserves the raw JSON response', async () => {
    await expect(upload(`${base}/error`, new Blob())).rejects.toMatchObject({
      name: 'UploadError',
      code: 'HTTP_ERROR',
      status: 409,
      response: '{"error":"conflict"}'
    });
  });

  it('requires XHR for progress rather than silently ignoring the callback', async () => {
    await expect(upload(`${base}/put`, new Blob(), { onProgress: () => {} })).rejects.toMatchObject({
      code: 'UNSUPPORTED_ENVIRONMENT'
    });
  });
});
