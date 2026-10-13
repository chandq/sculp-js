/* global HeadersInit, RequestInit */
// Internal browser transport shared by upload and download. No DOM or file-saving policy.
export interface TransferProgress {
  loaded: number;
  total?: number;
  percent?: number;
  lengthComputable: boolean;
  done: boolean;
}

export type TransferCode = 'INVALID_OPTIONS' | 'UNSUPPORTED_ENVIRONMENT' | 'NETWORK_ERROR' | 'HTTP_ERROR' | 'ABORTED';

interface TransferResponse {
  status: number;
  body: Blob | string;
  contentType: string | null;
  headers: () => Record<string, string>;
}

interface TransferContext {
  // Stops accepting cancellation immediately before an irreversible action (download click).
  commit: () => boolean;
  readText: (blob: Blob) => Promise<string>;
}

interface TransferOptions<T> {
  url: string;
  method: 'GET' | 'POST' | 'PUT';
  body?: FormData | Blob;
  headers?: HeadersInit;
  signal?: AbortSignal;
  transport?: 'auto' | 'fetch' | 'xhr';
  onProgress?: (progress: TransferProgress) => void;
  direction: 'upload' | 'download';
  responseType: 'blob' | 'text';
  isSuccess: (status: number) => boolean;
  error: (code: TransferCode, status: number, cause?: unknown, reason?: string) => Error;
  validate?: () => void;
  consume: (response: TransferResponse, context: TransferContext) => T | Promise<T>;
}

export function forEachHeader(headers: HeadersInit | undefined, visit: (name: string, value: string) => void): void {
  if (!headers) return;
  if (Array.isArray(headers)) {
    headers.forEach(([name, value]) => visit(name, value));
  } else if (typeof headers.forEach === 'function') {
    (headers as Headers).forEach((value, name) => visit(name, value));
  } else {
    Object.entries(headers).forEach(([name, value]) => visit(name, value));
  }
}

function xhrHeaders(xhr: XMLHttpRequest): Record<string, string> {
  const headers: Record<string, string> = Object.create(null);
  xhr
    .getAllResponseHeaders()
    .split(/\r?\n/)
    .forEach(line => {
      const colon = line.indexOf(':');
      if (colon < 1) return;
      const name = line.slice(0, colon).trim().toLowerCase();
      const value = line.slice(colon + 1).trim();
      headers[name] = headers[name] === undefined ? value : `${headers[name]}, ${value}`;
    });
  return headers;
}

export function transfer<T>(options: TransferOptions<T>): Promise<T> {
  const {
    url,
    method,
    body,
    headers,
    signal,
    transport = 'auto',
    onProgress,
    direction,
    responseType,
    isSuccess,
    error,
    consume
  } = options;
  return new Promise((resolve, reject) => {
    let state: 'active' | 'committed' | 'settled' = 'active';
    let status = 0;
    let xhr: XMLHttpRequest | undefined;
    let cancelRead: (() => void) | undefined;
    let receiving = false;
    let progressDone = false;
    const active = () => state === 'active';
    const cleanup = (stop = false) => {
      signal?.removeEventListener('abort', onAbort);
      if (xhr) {
        const request = xhr;
        xhr = undefined;
        request.onload = request.onerror = request.onabort = request.onprogress = null;
        if (direction === 'upload' && onProgress) {
          request.upload.onprogress = request.upload.onload = null;
        }
        try {
          if (stop) request.abort();
        } finally {
          cancelRead?.();
        }
      } else cancelRead?.();
    };
    const fail = (cause: unknown, stop = false) => {
      if (state === 'settled') return;
      state = 'settled';
      try {
        cleanup(stop);
      } catch {
        // Preserve the original failure even if a host cleanup API also fails.
        reject(cause);
        return;
      }
      reject(cause);
    };
    const onAbort = () => {
      if (!active()) return;
      status = xhr?.status || status;
      fail(error('ABORTED', status, signal?.reason, 'The request was aborted by the provided AbortSignal.'), true);
    };
    const progress = (event?: ProgressEvent, done = false) => {
      if (!onProgress || !active() || progressDone) return;
      if (done) progressDone = true;
      const loaded = event?.loaded ?? 0;
      const total = event?.total;
      const lengthComputable = Boolean(
        event?.lengthComputable && total !== undefined && total > 0 && Number.isFinite(total)
      );
      try {
        onProgress({
          loaded,
          total: lengthComputable ? total : undefined,
          percent: lengthComputable ? Math.min(100, Math.max(0, (loaded / total!) * 100)) : undefined,
          lengthComputable,
          done
        });
      } catch (cause) {
        fail(cause, true);
      }
    };
    const readText = (blob: Blob): Promise<string> => {
      if (typeof blob.text === 'function') return blob.text();
      return new Promise((resolveText, rejectText) => {
        const reader = new FileReader();
        const release = () => {
          reader.onload = reader.onerror = reader.onabort = null;
          cancelRead = undefined;
        };
        cancelRead = () => {
          release();
          try {
            if (reader.readyState === 1) reader.abort();
          } finally {
            rejectText(error('ABORTED', status, undefined, 'Reading the response body was aborted.'));
          }
        };
        reader.onload = () => {
          const text = reader.result as string;
          release();
          resolveText(text);
        };
        reader.onerror = () => {
          const cause = reader.error;
          release();
          rejectText(cause);
        };
        reader.onabort = cancelRead;
        try {
          reader.readAsText(blob);
        } catch (cause) {
          release();
          rejectText(cause);
        }
      });
    };
    const commit = () => {
      if (signal?.aborted) onAbort();
      if (!active()) return false;
      state = 'committed';
      cleanup();
      return true;
    };
    const complete = async (response: TransferResponse, event?: ProgressEvent) => {
      if (!active()) return;
      try {
        if (direction === 'download' && isSuccess(status)) progress(event, true);
        if (!active()) return;
        const result = await consume(response, { commit, readText });
        if (state === 'settled') return;
        cleanup();
        state = 'settled';
        resolve(result);
      } catch (cause) {
        fail(cause);
      }
    };
    const networkFailure = (cause: unknown) => {
      if (!active()) return;
      if (signal?.aborted) onAbort();
      else fail(error('NETWORK_ERROR', status, cause, 'The network request failed; inspect cause for details.'));
    };
    const runFetch = async () => {
      try {
        const init: RequestInit = { method, headers, signal };
        if (body !== undefined) init.body = body;
        const response = await fetch(url, init);
        if (!active()) return;
        status = response.status;
        let responseBody: Blob | string;
        try {
          responseBody = await (responseType === 'blob' ? response.blob() : response.text());
        } catch (cause) {
          if (signal?.aborted) onAbort();
          else
            fail(
              error(
                isSuccess(status) ? 'NETWORK_ERROR' : 'HTTP_ERROR',
                status,
                cause,
                'Failed to read the response body.'
              )
            );
          return;
        }
        await complete({
          status,
          body: responseBody,
          contentType: response.headers.get('Content-Type'),
          headers: () => {
            const result: Record<string, string> = Object.create(null);
            response.headers.forEach((value, name) => {
              result[name.toLowerCase()] = value;
            });
            return result;
          }
        });
      } catch (cause) {
        networkFailure(cause);
      }
    };
    if (!['auto', 'fetch', 'xhr'].includes(transport)) {
      fail(error('INVALID_OPTIONS', 0, undefined, 'transport must be "auto", "fetch", or "xhr".'));
      return;
    }
    if (onProgress !== undefined && typeof onProgress !== 'function') {
      fail(error('INVALID_OPTIONS', 0, undefined, 'onProgress must be a function.'));
      return;
    }
    if (transport === 'fetch' && onProgress !== undefined) {
      fail(error('INVALID_OPTIONS', 0, undefined, 'onProgress requires XHR; use transport "auto" or "xhr".'));
      return;
    }
    if (signal?.aborted) {
      onAbort();
      return;
    }
    const useXHR =
      transport === 'xhr' || (transport === 'auto' && (onProgress !== undefined || typeof fetch !== 'function'));
    if (useXHR ? typeof XMLHttpRequest !== 'function' : typeof fetch !== 'function') {
      const reason = !useXHR
        ? 'fetch is not available in this environment.'
        : onProgress !== undefined
        ? 'onProgress requires XMLHttpRequest, which is not available in this environment.'
        : transport === 'auto'
        ? 'Neither fetch nor XMLHttpRequest is available in this environment.'
        : 'XMLHttpRequest is not available in this environment.';
      fail(error('UNSUPPORTED_ENVIRONMENT', 0, undefined, reason));
      return;
    }
    try {
      options.validate?.();
    } catch (cause) {
      fail(cause);
      return;
    }
    signal?.addEventListener('abort', onAbort, { once: true });
    if (!useXHR) {
      void runFetch();
      return;
    }
    let setupStage = 'create XMLHttpRequest';
    try {
      const request = new XMLHttpRequest();
      xhr = request;
      setupStage = 'register XHR upload progress listeners';
      // Register upload events before open/send for browser interoperability.
      if (direction === 'upload' && onProgress) {
        request.upload.onprogress = event => progress(event);
        request.upload.onload = event => progress(event, true);
      }
      setupStage = 'open the XHR request';
      request.open(method, url, true);
      setupStage = 'set the XHR responseType';
      request.responseType = responseType;
      setupStage = 'set the XHR request headers';
      forEachHeader(headers, (name, value) => request.setRequestHeader(name, value));
      setupStage = 'register XHR response listeners';
      request.onload = event => {
        if (!active() || receiving) return;
        receiving = true;
        status = request.status;
        void complete(
          {
            status,
            body: request.response,
            contentType: request.getResponseHeader('Content-Type'),
            headers: () => xhrHeaders(request)
          },
          event
        );
      };
      request.onerror = networkFailure;
      request.onabort = () => {
        if (active()) fail(error('ABORTED', status, undefined, 'The XMLHttpRequest was aborted.'));
      };
      if (direction === 'download' && onProgress)
        request.onprogress = event => {
          if (!receiving && active()) {
            status = request.status;
            progress(event);
          }
        };
    } catch (cause) {
      fail(error('INVALID_OPTIONS', status, cause, `Failed to ${setupStage}.`));
      return;
    }
    progress();
    if (!active()) return;
    try {
      if (body === undefined) xhr!.send();
      else xhr!.send(body);
    } catch (cause) {
      networkFailure(cause);
    }
  });
}
