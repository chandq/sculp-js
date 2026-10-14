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
Both fetch and XHR paths run, including the existing download regressions.

These are correctness checks, not a throughput benchmark or a guarantee for
arbitrary file sizes. Safari, Firefox and mobile browsers require separate
validation for the application's supported environments.
