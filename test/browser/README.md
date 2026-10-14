# Transfer browser checks

Run from the repository root with Node.js 22 and Google Chrome installed:

```bash
npm run build
npm run test:browser-transfer
```

Set `CHROME_PATH` to use another Chromium-compatible executable. The script starts
two loopback HTTP servers and a headless browser with an isolated temporary
profile. It needs no additional npm dependency or external service, and removes
its profile and downloaded files on exit.

Checks cover real cross-origin downloads, file contents, multipart uploads,
8 MiB PUT uploads with server-side SHA-256 verification, CORS/preflight,
response headers, JSON/text/Blob responses, HTTP and parsing failures, and
cancellation during a throttled upload or while waiting for the server.
General requests also cover cross-origin PATCH with JSON, URLSearchParams and
FormData, HEAD responses, Blob parsing and response reception progress.
Credential checks verify cookie sending and Set-Cookie handling for same-origin
and cross-origin requests, redirects, explicit Authorization headers, missing
CORS credential permission, wildcard origins, and rejection of omit/XHR conflicts
before sending. The loopback servers use different ports on the same host:
these are cross-origin, same-site tests, not third-party cookie policy tests.
Timeout checks verify both stalled headers and stalled response bodies, including
server-observed connection closure for fetch and XHR.
Both fetch and XHR paths run, including the existing download regressions.

These are correctness checks, not a throughput benchmark or a guarantee for
arbitrary file sizes. Safari, Firefox and mobile browsers require separate
validation for the application's supported environments.

- 取消前置检查：已取消时直接返回 ABORTED，跳过序列化和请求准备。
- 可选超时：timeout 单位毫秒，默认 0 禁用；覆盖发送、等待和响应体读取，超时真正中止传输并返回 TIMEOUT。禁用时不创建计时器或额外控制器。
- 凭据严格映射：遵循 WHATWG XHR 规范。

| `credentials`         | fetch        | XHR                      |
| --------------------- | ------------ | ------------------------ |
| `same-origin`（默认） | 同源凭据     | `withCredentials: false` |
| `include`             | 允许跨域凭据 | `withCredentials: true`  |
| `omit`                | 禁用自动凭据 | 发送前拒绝               |
