# sculp-js

A lightweight TypeScript utility library with zero runtime dependencies, ESM,
CommonJS and UMD builds, and module-specific imports for tree-shaking.

[![Node.js CI](https://github.com/chandq/sculp-js/actions/workflows/release.yml/badge.svg)](https://github.com/chandq/sculp-js/actions/workflows/release.yml)
[![npm](https://img.shields.io/npm/v/sculp-js.svg)](https://www.npmjs.com/package/sculp-js)
[![license](https://img.shields.io/npm/l/sculp-js.svg)](./LICENSE)
[![codecov](https://codecov.io/gh/chandq/sculp-js/graph/badge.svg?token=VZ6TERPGI9)](https://codecov.io/gh/chandq/sculp-js)

[API documentation](https://chandq.github.io/sculp-js/) · [Usage](#usage) · [Contributing](./CONTRIBUTING.md)

## Installation

```bash
npm install sculp-js
```

For a browser script, use `https://unpkg.com/sculp-js` or `https://cdn.jsdelivr.net/npm/sculp-js`.
Pin a version for production.

## Usage

```ts
// ES Modules - Default import
import sculp from 'sculp-js';
import { cloneDeep, forEachDeep } from 'sculp-js';

const tree = [{ id: 1, children: [{ id: 2 }] }];
const copy = cloneDeep(tree);
forEachDeep(copy, node => console.log(node.id));
```

Import individual modules when only a few utilities are needed:

```ts
// ES Modules - Default import
import requestClient from 'sculp-js/request';
import { request, createRequestClient } from 'sculp-js/request';
import { qsStringify } from 'sculp-js/qs';
import { isEmail } from 'sculp-js/validator';

// CommonJS
const { cloneDeep } = require('sculp-js/cloneDeep');
```

Utilities cover arrays, objects, trees, strings, dates, numbers, type checks,
validation, query strings, encoding, async helpers and browser APIs. See the
[API reference](https://chandq.github.io/sculp-js/) for the full list.

### HTTP requests

```ts
import { request, RequestError } from 'sculp-js/request';

const controller = new AbortController();
try {
  const { data } = await request<{ id: number }>('/api/users', {
    method: 'POST',
    json: { name: 'Alice' },
    timeout: 10000,
    signal: controller.signal
  });
  console.log(data?.id);
} catch (error) {
  if (error instanceof RequestError) console.error(error.code, error.status);
}
```

- Defaults: GET, JSON response, automatic transport selection. Results contain
  `status`, `headers` and `data`; all 2xx statuses succeed. Use `responseType: 'text'`
  or `'blob'` for other formats. HEAD, 204/205 and empty JSON responses yield undefined data.
- Use either `json` or a raw `body` (string, URLSearchParams, FormData, Blob/File).
  GET/HEAD reject bodies; FormData must supply its own Content-Type boundary.
  Caller headers are never modified. Use `qsStringify` to compose query strings.
- HTTP failures use `HTTP_ERROR` and retain the raw body in `error.response`;
  invalid successful JSON uses `RESPONSE_ERROR`. Generics do not validate data.
- `signal` cancels with `ABORTED`; pre-aborted requests skip preparation.
  `timeout` accepts integer milliseconds from 0 to 2147483647 (0 disables it).
  It covers transport setup, sending, waiting and body reading, aborting the
  transport with `TIMEOUT`. It excludes serialization and cannot interrupt
  synchronous code; cancellation and timeout use the first terminal event processed.
- `onProgress` reports response reception through XHR and conflicts with explicit
  fetch. Its `done` flag does not guarantee successful parsing. Use `upload` for
  request-body progress and `crossOriginDownload` to trigger browser file saving.

| `credentials`           | fetch                                                     | XHR                                                       |
| ----------------------- | --------------------------------------------------------- | --------------------------------------------------------- |
| `same-origin` (default) | Same-origin automatic credentials and response cookies    | `withCredentials: false`; same-origin cookies still apply |
| `include`               | Allow cross-origin credentials and response cookies       | `withCredentials: true`                                   |
| `omit`                  | Exclude automatic credentials and ignore response cookies | Unsupported                                               |

`omit` with XHR or progress rejects with `INVALID_OPTIONS`; auto without fetch
rejects with `UNSUPPORTED_ENVIRONMENT`. Explicit Authorization headers are not
removed. Cross-origin `include` requires an explicit matching
`Access-Control-Allow-Origin` and `Access-Control-Allow-Credentials: true`, and
still respects browser cookie policies.

Node.js requires native fetch and absolute URLs; timed fetch also requires
AbortController. The library provides no cookie jar. Responses are buffered in
memory, with no automatic retries, caching or business-data validation.

### Request clients

```ts
import { createRequestClient } from 'sculp-js/request';

const api = createRequestClient({
  baseURL: 'https://api.example.com/v1/',
  timeout: 10000,
  headers: { Accept: 'application/json' }
});

const { request: apiRequest } = api; // Works without `this` binding.
const { data } = await apiRequest<{ id: number }>('users/1');
await apiRequest('health', { timeout: 0, omitHeaders: ['Authorization'] });
await apiRequest('/users', { baseURL: 'https://other.example.com/v2' });
await apiRequest('https://third.example.com/users');
```

- Clients snapshot defaults and expose a frozen object. Defaults are limited to
  headers, timeout, credentials and transport. Call values override defaults;
  undefined inherits and `timeout: 0` disables the default timeout.
- Required `baseURL` is an absolute HTTP(S) URL without embedded credentials.
  Relative paths append to the base prefix, as in Axios: with `https://host/v1`
  or `https://host/v1/`, both `users` and `/users` resolve to `/v1/users`.
  A call-level `baseURL` overrides the instance base for that request only;
  absolute URLs take precedence over either base, and `//host/path` inherits
  the effective base's protocol. Different origins are allowed. Changing the
  destination retains default/dynamic headers; use `omitHeaders` to remove
  Authorization when needed. `baseURL` is not an access restriction.
- Headers merge case-insensitively: static defaults → dynamic headers → call
  headers → `omitHeaders` deletion. Duplicate names use the last value. Automatic
  Content-Type generation still applies after deletion.
- Optional `getHeaders: () => HeadersInit | undefined` reads changing tokens once
  per request, synchronously. Pre-aborted requests skip it. Async token refresh
  is not built in. Invalid fixed configuration throws `RequestError` at creation;
  request preparation failures reject with `INVALID_OPTIONS` and preserve `cause`.

Instances isolate configuration, not browser cookies or connections. Scope SSR
credentials to the incoming request/session. A client or its detached request
method retains its configuration and any context captured by `getHeaders` until
those references are released; clients have no background resources to dispose.

## Community

[Contributing](./CONTRIBUTING.md) · [Code of Conduct](./CODE_OF_CONDUCT.md) ·
[Security Policy](./SECURITY.md) · [Report an issue](https://github.com/chandq/sculp-js/issues)

## License

MIT © 2023-present [chandq](https://github.com/chandq)
