import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, mkdir, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { once } from 'node:events';

// Run after npm run build. CHROME_PATH can select a Chromium-compatible browser.
const workspace = process.cwd();
const temp = await mkdtemp(join(tmpdir(), 'sculp-browser-audit-'));
const downloads = join(temp, 'downloads');
await mkdir(downloads);
const payload = Buffer.alloc(512 * 1024, 97);
const calls = [];
let pageOrigin;
const resourceServer = createServer((req, res) => {
  calls.push({ path: req.url, method: req.method, auth: req.headers.authorization });
  if (!req.url.endsWith('/cors-denied')) {
    res.setHeader('Access-Control-Allow-Origin', pageOrigin);
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Expose-Headers', 'X-Upload-Id');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS');
  }
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  if (req.url === '/request/echo') {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          method: req.method,
          body: Buffer.concat(chunks).toString(),
          contentType: req.headers['content-type']
        })
      );
    });
    return;
  }
  if (req.url.startsWith('/upload/')) {
    const call = calls.at(-1);
    let bytes = 0;
    const hash = createHash('sha256');
    const chunks = [];
    req.on('data', chunk => {
      bytes += chunk.length;
      hash.update(chunk);
      if (req.url === '/upload/multipart') chunks.push(chunk);
    });
    req.on('aborted', () => {
      call.aborted = true;
      call.bytes = bytes;
    });
    req.on('end', () => {
      call.bytes = bytes;
      call.digest = hash.digest('hex');
      call.contentType = req.headers['content-type'];
      if (chunks.length) call.multipart = Buffer.concat(chunks).toString();
      const send = () => {
        if (res.destroyed) return;
        res.setHeader('X-Upload-Id', 'upload-123');
        if (req.url === '/upload/empty') {
          res.writeHead(204);
          res.end();
          return;
        }
        if (req.url === '/upload/malformed') {
          res.end('not json');
          return;
        }
        if (req.url === '/upload/error') {
          res.writeHead(413);
          res.end('too large');
          return;
        }
        if (req.url === '/upload/binary') {
          res.setHeader('Content-Type', 'application/octet-stream');
          res.end('binary result');
          return;
        }
        if (req.url === '/upload/text') {
          res.end('stored');
          return;
        }
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ bytes, sha256: call.digest }));
      };
      if (req.url === '/upload/delayed') {
        const timer = setTimeout(send, 500);
        res.on('close', () => clearTimeout(timer));
      } else send();
    });
    return;
  }
  if (req.url === '/json-error') {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end('{"error":"forbidden"}');
    return;
  }
  if (req.url === '/text-error') {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('missing');
    return;
  }
  if (req.url === '/empty') {
    res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'Content-Length': 0 });
    res.end();
    return;
  }
  res.setHeader('Content-Type', 'application/octet-stream');
  if (req.url !== '/chunked') res.setHeader('Content-Length', payload.length);
  res.writeHead(200);
  let offset = 0;
  const timer = setInterval(() => {
    res.write(payload.subarray(offset, offset + 65536));
    offset += 65536;
    if (offset >= payload.length) {
      clearInterval(timer);
      res.end();
    }
  }, 40);
  res.on('close', () => clearInterval(timer));
});
const pageServer = createServer(async (req, res) => {
  if (req.url.startsWith('/module/')) {
    try {
      const root = resolve(workspace, 'dist/esm');
      const file = resolve(root, req.url.slice('/module/'.length));
      assert(file.startsWith(root + sep));
      const content = await readFile(file);
      res.writeHead(200, { 'Content-Type': 'text/javascript' });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end();
    }
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<!doctype html><body>Download audit</body>');
  }
});
await new Promise(resolve => pageServer.listen(0, '127.0.0.1', resolve));
pageOrigin = `http://127.0.0.1:${pageServer.address().port}`;
await new Promise(resolve => resourceServer.listen(0, '127.0.0.1', resolve));
const resourceOrigin = `http://127.0.0.1:${resourceServer.address().port}`;
const chrome = spawn(
  process.env.CHROME_PATH ||
    (process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : 'google-chrome'),
  [
    '--headless=new',
    '--remote-debugging-port=0',
    `--user-data-dir=${join(temp, 'profile')}`,
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ],
  { stdio: ['ignore', 'ignore', 'pipe'] }
);
let socket;
let timeout;
const report = [];
try {
  const endpoint = await new Promise((resolve, reject) => {
    timeout = setTimeout(() => reject(new Error('Chrome startup timed out')), 20000);
    let output = '';
    chrome.stderr.on('data', chunk => {
      output += chunk;
      const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        clearTimeout(timeout);
        resolve(match[1]);
      }
    });
    chrome.on('error', reject);
    chrome.on('exit', code => reject(new Error(`Chrome exited: ${code}`)));
  });
  socket = new WebSocket(endpoint);
  await once(socket, 'open');
  let id = 0;
  const pending = new Map();
  const completed = new Set();
  const names = new Map();
  const unhandled = [];
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const request = pending.get(message.id);
      if (!request) return;
      pending.delete(message.id);
      clearTimeout(request.timer);
      if (message.error) request.reject(new Error(JSON.stringify(message.error)));
      else request.resolve(message.result);
    } else {
      if (message.method === 'Browser.downloadWillBegin')
        names.set(message.params.guid, message.params.suggestedFilename);
      if (message.method === 'Browser.downloadProgress' && message.params.state === 'completed')
        completed.add(names.get(message.params.guid));
      if (message.method === 'Runtime.exceptionThrown') unhandled.push(message.params.exceptionDetails);
    }
  });
  const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      const requestId = ++id;
      const timer = setTimeout(() => {
        pending.delete(requestId);
        reject(new Error(`Browser command timed out: ${method}`));
      }, 20000);
      pending.set(requestId, { resolve, reject, timer });
      socket.send(JSON.stringify({ id: requestId, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  const version = await send('Browser.getVersion');
  report.push({ browser: version.product });
  await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloads, eventsEnabled: true });
  const { targetId } = await send('Target.createTarget', { url: pageOrigin });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Runtime.enable', {}, sessionId);
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, sessionId);
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  await evaluate(`(async () => {
    window.api = await import('/module/download.mjs');
    window.uploader = await import('/module/upload.mjs');
    window.requester = await import('/module/request.mjs');
    window.base = ${JSON.stringify(resourceOrigin)};
    window.activeURLs = new Set();
    const create = URL.createObjectURL.bind(URL), revoke = URL.revokeObjectURL.bind(URL);
    URL.createObjectURL = blob => { const url = create(blob); activeURLs.add(url); return url; };
    URL.revokeObjectURL = url => { activeURLs.delete(url); revoke(url); };
    window.transportCalls = { fetch: 0, xhr: 0 };
    const originalFetch = window.fetch;
    window.fetch = (...args) => { transportCalls.fetch++; return originalFetch(...args); };
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (...args) { transportCalls.xhr++; return originalOpen.apply(this, args); };
  })()`);
  for (const scenario of [
    { name: 'fetch.bin', path: '/fixed', progress: false },
    { name: 'xhr-fixed.bin', path: '/fixed', progress: true },
    { name: 'xhr-chunked.bin', path: '/chunked', progress: true },
    { name: 'xhr-empty.bin', path: '/empty', progress: true }
  ]) {
    const result = await evaluate(`(async () => {
      const events = [];
      const before = { ...transportCalls };
      await api.crossOriginDownload(base + ${JSON.stringify(scenario.path)}, ${JSON.stringify(scenario.name)}, {
        headers: { Authorization: 'Bearer browser-audit' },
        ${scenario.progress ? 'onProgress: p => events.push(p),' : ''}
      });
      return { events, fetch: transportCalls.fetch - before.fetch, xhr: transportCalls.xhr - before.xhr,
        urls: activeURLs.size, links: document.querySelectorAll('a').length };
    })()`);
    assert.equal(result.fetch, scenario.progress ? 0 : 1);
    assert.equal(result.xhr, scenario.progress ? 1 : 0);
    assert.equal(result.urls, 0);
    assert.equal(result.links, 0);
    if (scenario.progress) {
      assert.equal(result.events.at(-1).done, true);
      assert.equal(result.events.filter(p => p.done).length, 1);
      if (scenario.path === '/fixed') assert.equal(result.events.at(-1).percent, 100);
      if (scenario.path === '/chunked') assert(result.events.every(p => p.percent === undefined));
    }
    const until = Date.now() + 5000;
    while (!completed.has(scenario.name) && Date.now() < until) await new Promise(resolve => setTimeout(resolve, 25));
    assert(completed.has(scenario.name), 'Browser download did not complete');
    const bytes = await readFile(join(downloads, scenario.name));
    assert.deepEqual(bytes, scenario.path === '/empty' ? Buffer.alloc(0) : payload);
    report.push({ case: scenario.name, bytes: bytes.length, progressEvents: result.events.length, passed: true });
  }
  for (const transport of ['fetch', 'xhr']) {
    for (const path of ['/json-error', '/text-error', '/cors-denied', '/cancel']) {
      const result = await evaluate(`(async () => {
        const controller = new AbortController();
        const before = { ...transportCalls };
        const task = api.crossOriginDownload(base + ${JSON.stringify(path)}, 'must-not-save.bin', {
          transport: ${JSON.stringify(transport)}, signal: controller.signal
        });
        const timer = ${path === '/cancel' ? 'setTimeout(() => controller.abort(), 100)' : 'undefined'};
        try { await task; return { unexpectedSuccess: true }; }
        catch (error) { return { code: error.code, status: error.status, response: typeof error.response === 'string' ? error.response : undefined,
          typed: error instanceof api.CrossOriginDownloadError, blobResponse: error.response instanceof Blob,
          fetch: transportCalls.fetch - before.fetch, xhr: transportCalls.xhr - before.xhr, urls: activeURLs.size }; }
        finally { clearTimeout(timer); }
      })()`);
      const expected =
        path === '/cancel' ? 'ABORTED' : path === '/cors-denied' ? 'ERROR_CONNECTION_REFUSED' : 'HTTP_ERROR';
      assert.equal(result.code, expected);
      if (path === '/cancel') assert.equal(result.status, 200);
      assert.equal(result.typed, true);
      assert.equal(result.fetch, transport === 'fetch' ? 1 : 0);
      assert.equal(result.xhr, transport === 'xhr' ? 1 : 0);
      assert.equal(result.urls, 0);
      if (path === '/json-error') assert.equal(result.response, '{"error":"forbidden"}');
      if (path === '/text-error') assert.equal(result.blobResponse, true);
      report.push({ case: `${transport}${path}`, ...result, passed: true });
    }
  }
  const conflict = await evaluate(`(async () => {
    const before = { ...transportCalls };
    try { await api.crossOriginDownload(base + '/fixed', 'conflict.bin', { transport: 'fetch', onProgress() {} }); }
    catch (error) { return { code: error.code, fetch: transportCalls.fetch - before.fetch, xhr: transportCalls.xhr - before.xhr }; }
  })()`);
  assert.deepEqual(conflict, { code: 'INVALID_OPTIONS', fetch: 0, xhr: 0 });
  for (const transport of ['fetch', 'xhr']) {
    for (const kind of ['json', 'params', 'form', 'head', 'blob']) {
      const result = await evaluate(`(async () => {
        const events = [];
        const form = new FormData();
        form.append('name', 'Alice');
        const options = {
          transport: ${JSON.stringify(transport)},
          method: ${JSON.stringify(kind === 'head' ? 'HEAD' : 'PATCH')},
          ${transport === 'xhr' ? 'onProgress: p => events.push(p),' : ''}
          ...${
            kind === 'json'
              ? "{ json: { name: '测试' } }"
              : kind === 'params'
              ? "{ body: new URLSearchParams({ q: 'a b&c' }) }"
              : kind === 'form'
              ? '{ body: form }'
              : kind === 'blob'
              ? "{ responseType: 'blob' }"
              : '{}'
          }
        };
        const result = await requester.request(base + '/request/echo', options);
        if (options.responseType === 'blob') result.data = JSON.parse(await result.data.text());
        return { ...result, events };
      })()`);
      assert.equal(result.status, 200);
      if (kind === 'head') assert.equal(result.data, undefined);
      else assert.equal(result.data.method, 'PATCH');
      if (kind === 'json') {
        assert.equal(result.data.body, '{"name":"测试"}');
        assert.equal(result.data.contentType, 'application/json');
      } else if (kind === 'params') {
        assert.equal(result.data.body, 'q=a+b%26c');
        assert.match(result.data.contentType, /^application\/x-www-form-urlencoded/i);
      } else if (kind === 'form') {
        assert.match(result.data.contentType, /^multipart\/form-data; boundary=/);
        assert(result.data.body.includes('name="name"'));
        assert(result.data.body.includes('Alice'));
      }
      if (transport === 'xhr') assert.equal(result.events.at(-1).done, true);
      report.push({ case: `${transport}-request-${kind}`, passed: true });
    }
  }
  assert.equal(unhandled.length, 0);
  assert.equal(completed.size, 4);
  assert(calls.some(c => c.method === 'OPTIONS'));
  assert(calls.filter(c => c.auth).every(c => c.auth === 'Bearer browser-audit'));
  report.push({ case: 'fetch-progress-conflict', ...conflict, passed: true });
  // Real cross-origin uploads, with byte-for-byte/hash checks on the receiving server.
  for (const transport of ['fetch', 'xhr']) {
    const raw = await evaluate(`(async () => {
      const before = { ...transportCalls };
      const events = [];
      const bytes = new Uint8Array(8 * 1024 * 1024).fill(97);
      const body = new File([bytes], 'data.bin', { type: 'application/octet-stream' });
      const started = performance.now();
      const result = await uploader.upload(base + '/upload/raw', body, {
        method: 'PUT', transport: '${transport}', headers: { Authorization: 'Bearer browser-audit' },
        ${transport === 'xhr' ? 'onProgress: p => events.push(p),' : ''}
      });
      return { ...result, elapsedMs: performance.now() - started, events,
        fetch: transportCalls.fetch - before.fetch, xhr: transportCalls.xhr - before.xhr };
    })()`);
    assert.equal(raw.status, 201);
    assert.equal(raw.data.bytes, 8 * 1024 * 1024);
    assert.equal(
      raw.data.sha256,
      createHash('sha256')
        .update(Buffer.alloc(8 * 1024 * 1024, 97))
        .digest('hex')
    );
    assert.equal(raw.headers['x-upload-id'], 'upload-123');
    assert.equal(raw.fetch, transport === 'fetch' ? 1 : 0);
    assert.equal(raw.xhr, transport === 'xhr' ? 1 : 0);
    if (transport === 'xhr') assert.equal(raw.events.filter(p => p.done).length, 1);
    report.push({ case: `${transport}-8MiB-PUT`, bytes: raw.data.bytes, elapsedMs: raw.elapsedMs, passed: true });

    const form = await evaluate(`(async () => {
      const body = new FormData();
      body.append('files', new File(['first-file'], 'first.txt'));
      body.append('files', new File(['second-file'], 'second.txt'));
      body.append('folderId', '123');
      return uploader.upload(base + '/upload/multipart', body, {
        transport: '${transport}', headers: { Authorization: 'Bearer browser-audit' }
      });
    })()`);
    assert.equal(form.status, 201);
    const received = calls.filter(c => c.path === '/upload/multipart' && c.method !== 'OPTIONS').at(-1);
    assert(received.contentType.startsWith('multipart/form-data; boundary='));
    assert(received.multipart.includes('name="files"; filename="first.txt"'));
    assert(received.multipart.includes('name="files"; filename="second.txt"'));
    assert(received.multipart.includes('first-file') && received.multipart.includes('second-file'));
    assert(received.multipart.includes('name="folderId"') && received.multipart.includes('123'));
    report.push({ case: `${transport}-multipart`, passed: true });

    for (const [endpoint, responseType, expected] of [
      ['empty', 'json', undefined],
      ['text', 'text', 'stored'],
      ['binary', 'blob', 'binary result']
    ]) {
      const result = await evaluate(`(async () => {
        const result = await uploader.upload(base + '/upload/${endpoint}', new Blob(['hello']), {
          transport: '${transport}', responseType: '${responseType}'
        });
        return { status: result.status, data: result.data instanceof Blob ? await result.data.text() : result.data };
      })()`);
      assert.equal(result.data, expected);
      report.push({ case: `${transport}-response-${endpoint}`, passed: true });
    }

    for (const [endpoint, expected] of [
      ['error', 'HTTP_ERROR'],
      ['malformed', 'RESPONSE_ERROR'],
      ['cors-denied', 'NETWORK_ERROR']
    ]) {
      const result = await evaluate(`(async () => {
        const before = { ...transportCalls };
        const events = [];
        try {
          await uploader.upload(base + '/upload/${endpoint}', new Blob(['hello']), {
            transport: '${transport}', ${transport === 'xhr' ? 'onProgress: p => events.push(p),' : ''}
          });
          return { unexpectedSuccess: true };
        } catch (error) { return { code: error.code, status: error.status,
          typed: error instanceof uploader.UploadError, events,
          fetch: transportCalls.fetch - before.fetch, xhr: transportCalls.xhr - before.xhr }; }
      })()`);
      assert.equal(result.code, expected);
      assert(result.typed);
      assert.equal(result.fetch, transport === 'fetch' ? 1 : 0);
      assert.equal(result.xhr, transport === 'xhr' ? 1 : 0);
      if (endpoint === 'error' && transport === 'xhr') assert.equal(result.events.at(-1).done, true);
      report.push({ case: `${transport}-upload-${endpoint}`, passed: true });
    }

    const cancelled = await evaluate(`(async () => {
      const controller = new AbortController();
      let sent = false;
      let resolved = false;
      const task = uploader.upload(base + '/upload/delayed', new Blob(['hello']), {
        transport: '${transport}', signal: controller.signal,
        ${
          transport === 'xhr'
            ? 'onProgress: p => { if (p.done) { sent = true; setTimeout(() => controller.abort(), 30); } },'
            : ''
        }
      });
      const timer = ${transport === 'fetch' ? 'setTimeout(() => controller.abort(), 100)' : 'undefined'};
      try { await task; resolved = true; return { resolved }; }
      catch (error) { return { code: error.code, sent, resolved }; }
      finally { clearTimeout(timer); }
    })()`);
    assert.equal(cancelled.code, 'ABORTED');
    assert.equal(cancelled.resolved, false);
    if (transport === 'xhr') assert.equal(cancelled.sent, true);
    report.push({ case: `${transport}-cancel-waiting-for-server`, passed: true });
  }

  await send('Network.enable', {}, sessionId);
  await send(
    'Network.emulateNetworkConditions',
    {
      offline: false,
      latency: 0,
      downloadThroughput: 1024 * 1024,
      uploadThroughput: 128 * 1024
    },
    sessionId
  );
  for (const transport of ['fetch', 'xhr']) {
    const cancelled = await evaluate(`(async () => {
      const controller = new AbortController();
      const events = [];
      const task = uploader.upload(base + '/upload/slow', new Blob([new Uint8Array(8 * 1024 * 1024)]), {
        transport: '${transport}', signal: controller.signal,
        ${transport === 'xhr' ? 'onProgress: p => events.push(p),' : ''}
      });
      const timer = setTimeout(() => controller.abort(), 250);
      try { await task; return { unexpectedSuccess: true }; }
      catch (error) { return { code: error.code, events }; }
      finally { clearTimeout(timer); }
    })()`);
    assert.equal(cancelled.code, 'ABORTED');
    assert(cancelled.events.every(p => !p.done));
    report.push({ case: `${transport}-cancel-during-send`, passed: true });
  }
  assert.equal(unhandled.length, 0);
  assert.equal(completed.size, 4, 'Uploads must not trigger file downloads');
  console.log(JSON.stringify({ report }, null, 2));
} finally {
  clearTimeout(timeout);
  socket?.close();
  const exited =
    !chrome.pid || chrome.exitCode !== null || chrome.signalCode !== null ? Promise.resolve() : once(chrome, 'exit');
  chrome.kill('SIGTERM');
  const forceExit = setTimeout(() => chrome.kill('SIGKILL'), 5000);
  try {
    await exited;
  } finally {
    clearTimeout(forceExit);
  }
  pageServer.closeAllConnections();
  resourceServer.closeAllConnections();
  await Promise.all([
    new Promise(resolve => pageServer.close(resolve)),
    new Promise(resolve => resourceServer.close(resolve))
  ]);
  await rm(temp, { recursive: true, force: true });
}
