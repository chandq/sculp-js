/* global HeadersInit */
import { forEachHeader, transfer } from './internal/transfer';
import { consumeHTTPResponse, isHTTPSuccess } from './internal/http-response';

/**
 * 响应体接收进度，仅由 XHR 提供。
 * @public
 */
export interface RequestProgress {
  /** 已接收字节数。 */
  loaded: number;
  /** 总字节数，无法计算时为 undefined。 */
  total?: number;
  /** 0～100 的百分比，无法计算时为 undefined。 */
  percent?: number;
  /** 是否可以计算总量和百分比。 */
  lengthComputable: boolean;
  /** 响应体接收完成；解析和业务处理是否成功仍须等待 Promise。 */
  done: boolean;
}

/**
 * 单次 HTTP 请求配置；body 原样发送，json 显式序列化，两者互斥。
 * @public
 */
export type RequestOptions = {
  /** 默认 GET；GET/HEAD 不允许携带 body 或 json。 */
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  /** 请求头；FormData 的 Content-Type 必须由传输层生成。 */
  headers?: HeadersInit;
  /** 默认 json；text 保留原始文本，blob 保留二进制响应。 */
  responseType?: 'json' | 'text' | 'blob';
  /** 默认 auto：有进度回调时使用 XHR，否则优先 fetch。失败不重试。 */
  transport?: 'auto' | 'fetch' | 'xhr';
  /** 响应接收进度，与请求体发送进度无关；仅同步回调，与显式 fetch 冲突。 */
  onProgress?: (progress: RequestProgress) => void;
  /** 取消发送或等待响应；取消不保证服务端停止处理。 */
  signal?: AbortSignal;
} & (
  | {
      /** 原始请求体，不自动序列化普通对象。 */
      body?: string | URLSearchParams | FormData | Blob;
      json?: never;
    }
  | {
      body?: never;
      /** JSON.stringify 序列化；未提供 Content-Type 时添加 application/json。undefined 表示无请求体。 */
      json: unknown;
    }
);

/**
 * HTTP 成功响应；泛型不执行运行时校验。
 * @public
 */
export interface RequestResult<T = unknown> {
  /** HTTP 状态码，所有 2xx 均视为成功。 */
  status: number;
  /** 当前环境允许读取的响应头，名称统一为小写。 */
  headers: Readonly<Record<string, string>>;
  /** 按 responseType 解析；HEAD、204/205 或空 JSON 响应为 undefined。 */
  data: T | undefined;
}

/**
 * 请求失败；程序判断使用 code。onProgress 自身抛出的异常保留原样。
 * @public
 */
export class RequestError extends Error {
  /** 无 HTTP 响应时为 0。 */
  readonly status: number;

  /** HTTP_ERROR 为非 2xx；RESPONSE_ERROR 为成功响应的 JSON 解析失败。 */
  readonly code:
    | 'INVALID_OPTIONS'
    | 'UNSUPPORTED_ENVIRONMENT'
    | 'NETWORK_ERROR'
    | 'HTTP_ERROR'
    | 'ABORTED'
    | 'RESPONSE_ERROR';

  /** 错误正文，保留文本或 Blob，不自动解析。 */
  response?: string | Blob;

  /** 底层异常或取消原因。 */
  cause?: unknown;

  /**
   * @param code - 稳定错误码。
   * @param status - HTTP 状态码，默认 0。
   * @param cause - 原始异常或取消原因。
   * @param reason - 可选的具体原因。
   */
  constructor(code: RequestError['code'], status = 0, cause?: unknown, reason?: string) {
    super(`Request failed: ${code} (status ${status})${reason ? `: ${reason}` : ''}`);
    this.name = 'RequestError';
    this.code = code;
    this.status = status;
    this.cause = cause;
    Object.setPrototypeOf(this, RequestError.prototype);
  }
}

/**
 * 发起单次 HTTP 请求，支持 JSON、文本、二进制响应以及取消和接收进度。
 *
 * @public
 * @param url - 请求地址；Node.js 原生 fetch 需要绝对地址。跨域须由服务端允许 CORS。
 * @param options - 默认 GET、auto 和 JSON 响应；method 不根据请求体自动推断。
 * @returns 等待 2xx 响应并完成解析后兑现；失败以 RequestError 拒绝。
 * @remarks
 * 不自动重试、缓存或校验业务数据，凭据采用默认同源策略。
 * 响应体完整读入内存，不提供流式消费。onProgress 同步抛错时以原异常拒绝。
 * Node.js 可使用原生 fetch；进度依赖 XMLHttpRequest，不可用时明确报错。
 * JSON 序列化遵循 JSON.stringify；循环引用、BigInt 或无法生成 JSON 文本的值会拒绝。
 * 不修改调用者的 headers；FormData 不允许手工设置 Content-Type。
 *
 * @example
 * ```ts
 * import { request } from 'sculp-js/request';
 *
 * const controller = new AbortController();
 * const { data } = await request<{ id: number }>('/api/users/1', {
 *   signal: controller.signal
 * });
 * console.log(data?.id);
 * ```
 *
 * @example
 * ```ts
 * import { request, RequestError } from 'sculp-js/request';
 *
 * try {
 *   await request('/api/users', { method: 'POST', json: { name: 'Alice' } });
 *   const result = await request('/api/health', { responseType: 'text' });
 *   console.log(result.data);
 * } catch (error) {
 *   if (error instanceof RequestError) console.error(error.code, error.status);
 * }
 * ```
 */
export function request<T = unknown>(
  url: string,
  options?: RequestOptions & { responseType?: 'json' }
): Promise<RequestResult<T>>;
/** @public */
export function request(
  url: string,
  options: RequestOptions & { responseType: 'text' }
): Promise<RequestResult<string>>;
/** @public */
export function request(url: string, options: RequestOptions & { responseType: 'blob' }): Promise<RequestResult<Blob>>;
/** @public */
export function request(url: string, options: RequestOptions): Promise<RequestResult>;
export function request(url: string, options: RequestOptions = {}): Promise<RequestResult> {
  try {
    const { method = 'GET', responseType = 'json', signal, transport, onProgress, json } = options;
    let { body, headers } = options;
    if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].includes(method)) {
      throw new TypeError('method must be GET, POST, PUT, PATCH, DELETE, HEAD, or OPTIONS.');
    }
    if (!['json', 'text', 'blob'].includes(responseType)) {
      throw new TypeError('responseType must be "json", "text", or "blob".');
    }
    if (body !== undefined && json !== undefined) throw new TypeError('body and json are mutually exclusive.');
    if ((method === 'GET' || method === 'HEAD') && (body !== undefined || json !== undefined)) {
      throw new TypeError('GET and HEAD must not have a request body.');
    }
    if (json !== undefined) {
      body = JSON.stringify(json);
      if (body === undefined) throw new TypeError('json must serialize to JSON text.');
      const entries: [string, string][] = [];
      let hasContentType = false;
      forEachHeader(headers, (name, value) => {
        if (name.trim().toLowerCase() === 'content-type') hasContentType = true;
        entries.push([name, value]);
      });
      if (!hasContentType) entries.push(['Content-Type', 'application/json']);
      headers = entries;
    } else if (body !== undefined && typeof body !== 'string') {
      const tag = Object.prototype.toString.call(body);
      if (!['[object URLSearchParams]', '[object FormData]', '[object Blob]', '[object File]'].includes(tag)) {
        throw new TypeError('body must be a string, URLSearchParams, FormData, Blob, or File.');
      }
      if (tag === '[object FormData]') {
        forEachHeader(headers, name => {
          if (name.trim().toLowerCase() === 'content-type') {
            throw new TypeError(
              'Do not set Content-Type for FormData; the transport must generate the multipart boundary.'
            );
          }
        });
      }
    }
    return transfer({
      url,
      method,
      body,
      headers,
      signal,
      transport,
      onProgress,
      direction: 'download',
      responseType: responseType === 'blob' ? 'blob' : 'text',
      isSuccess: isHTTPSuccess,
      error: createRequestError,
      consume: response => consumeHTTPResponse(response, responseType, createRequestError, method === 'HEAD')
    });
  } catch (cause) {
    return Promise.reject(
      createRequestError(
        'INVALID_OPTIONS',
        0,
        cause,
        cause instanceof Error ? cause.message : 'Failed to prepare the request.'
      )
    );
  }
}

function createRequestError(
  code: RequestError['code'],
  status: number,
  cause?: unknown,
  reason?: string
): RequestError {
  return new RequestError(code, status, cause, reason);
}

export default { request, RequestError };
