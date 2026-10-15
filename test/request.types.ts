import {
  request,
  RequestOptions,
  RequestResult,
  createRequestClient,
  RequestClientRequestOptions
} from '../src/request';

// Compile-only assertions: no network requests are executed.
async function checkRequestTypes(options: RequestOptions) {
  const json: RequestResult<{ id: number }> = await request<{ id: number }>('/users');
  const text: RequestResult<string> = await request('/users', { responseType: 'text' });
  const blob: RequestResult<Blob> = await request('/users', { responseType: 'blob' });
  const dynamic: RequestResult = await request('/users', options);
  request('/users', { timeout: 5000, credentials: 'include' });
  // @ts-expect-error timeout is a number of milliseconds
  request('/users', { timeout: '5000' });
  // @ts-expect-error credentials uses modes, not the XHR boolean
  request('/users', { credentials: true });
  // @ts-expect-error body and json are mutually exclusive
  request('/users', { method: 'POST', body: 'raw', json: {} });
  // @ts-expect-error raw body does not accept arbitrary objects
  request('/users', { method: 'POST', body: { id: 1 } });
  // @ts-expect-error a JSON generic must not override the text response type
  request<number>('/users', { responseType: 'text' });
  // @ts-expect-error text response is not a number
  const wrong: RequestResult<number> = await request('/users', { responseType: 'text' });
  return { json, text, blob, dynamic, wrong };
}

void checkRequestTypes;

async function checkClientTypes(options: RequestClientRequestOptions) {
  const client = createRequestClient({ baseURL: 'https://api.example.com/' });
  const json: RequestResult<{ id: number }> = await client.request<{ id: number }>('users');
  const text: RequestResult<string> = await client.request('users', { responseType: 'text' });
  const blob: RequestResult<Blob> = await client.request('users', {
    responseType: 'blob',
    omitHeaders: ['Authorization']
  });
  const dynamic: RequestResult = await client.request('users', options);
  client.request('users', { baseURL: 'https://other.example.com/v2/' });
  // @ts-expect-error baseURL must be a string
  client.request('users', { baseURL: 123 });
  // @ts-expect-error baseURL is explicit and required
  createRequestClient({ timeout: 100 });
  // @ts-expect-error responseType belongs to each request, not the instance
  createRequestClient({ baseURL: 'https://api.example.com/', responseType: 'text' });
  // @ts-expect-error providers must be synchronous
  createRequestClient({ baseURL: 'https://api.example.com/', getHeaders: async () => ({ Authorization: 'token' }) });
  // @ts-expect-error client is read-only
  client.request = request;
  // @ts-expect-error body and json remain mutually exclusive
  client.request('users', { method: 'POST', body: 'raw', json: {} });
  // @ts-expect-error JSON generics cannot override text responses
  client.request<number>('users', { responseType: 'text' });
  return { json, text, blob, dynamic };
}

void checkClientTypes;
