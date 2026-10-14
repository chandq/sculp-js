import { request, RequestOptions, RequestResult } from '../src/request';

// Compile-only assertions: no network requests are executed.
async function checkRequestTypes(options: RequestOptions) {
  const json: RequestResult<{ id: number }> = await request<{ id: number }>('/users');
  const text: RequestResult<string> = await request('/users', { responseType: 'text' });
  const blob: RequestResult<Blob> = await request('/users', { responseType: 'blob' });
  const dynamic: RequestResult = await request('/users', options);
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
