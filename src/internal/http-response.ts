import { TransferCode, TransferResponse } from './transfer';

type ResponseError = Error & { response?: string | Blob };

export function isHTTPSuccess(status: number): boolean {
  return status >= 200 && status < 300;
}

// Read once in transfer, then apply the same HTTP/JSON policy to request and upload.
export function consumeHTTPResponse(
  response: TransferResponse,
  responseType: 'json' | 'text' | 'blob',
  error: (code: TransferCode | 'RESPONSE_ERROR', status: number, cause?: unknown, reason?: string) => ResponseError,
  empty = false
): { status: number; headers: Readonly<Record<string, string>>; data: unknown } {
  const { status, body } = response;
  if (!isHTTPSuccess(status)) {
    const failure = error('HTTP_ERROR', status, undefined, 'Expected an HTTP status between 200 and 299.');
    failure.response = body;
    throw failure;
  }
  let data: unknown = body;
  if (empty || status === 204 || status === 205) data = undefined;
  else if (responseType === 'json') {
    try {
      data = body === '' ? undefined : JSON.parse(body as string);
    } catch (cause) {
      const failure = error('RESPONSE_ERROR', status, cause, 'Failed to parse the response body as JSON.');
      failure.response = body;
      throw failure;
    }
  }
  return { status, headers: response.headers(), data };
}
