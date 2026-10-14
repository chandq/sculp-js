/* global HeadersInit */
import { forEachHeader, transfer } from './internal/transfer';
import { consumeHTTPResponse, isHTTPSuccess } from './internal/http-response';

/**
 * 请求体发送进度，仅由 XHR 提供。
 * @public
 */
export interface UploadProgress {
  /** 已发送字节数；FormData 包含 multipart 编码开销。 */
  loaded: number;
  /** 总字节数，无法计算时为 undefined。 */
  total?: number;
  /** 0～100 的百分比，无法计算时为 undefined。 */
  percent?: number;
  /** 是否可以计算总量和百分比。 */
  lengthComputable: boolean;
  /** 请求体发送完成；不代表服务端处理成功，仍须等待 Promise。 */
  done: boolean;
}

/**
 * 单次上传配置。
 * @public
 */
export interface UploadOptions {
  /** 默认 POST；原始文件或预签名地址可使用 PUT。 */
  method?: 'POST' | 'PUT';
  /** 请求头；FormData 不允许手工设置 Content-Type，boundary 由浏览器生成。 */
  headers?: HeadersInit;
  /** 默认 json；text 保留原始文本，blob 保留二进制响应。 */
  responseType?: 'json' | 'text' | 'blob';
  /** 默认 auto；提供 onProgress 时使用 XHR，否则优先 fetch。请求失败不重试。 */
  transport?: 'auto' | 'fetch' | 'xhr';
  /** 仅支持同步回调，不做内置节流；与显式 fetch 冲突。 */
  onProgress?: (progress: UploadProgress) => void;
  /** 可在发送中或等待服务端响应时取消；取消不保证服务端停止处理。 */
  signal?: AbortSignal;
}

/**
 * 服务端成功响应；HTTP 成功不代替业务数据校验。
 * @public
 */
export interface UploadResult<T = unknown> {
  /** HTTP 状态码，所有 2xx 均视为成功。 */
  status: number;
  /** 当前环境允许读取的响应头，名称统一为小写；跨域自定义头须由服务端暴露。 */
  headers: Readonly<Record<string, string>>;
  /** 根据 responseType 解析；204/205 或空 JSON 响应为 undefined。泛型不执行运行时校验。 */
  data: T | undefined;
}

/**
 * 上传失败。message 描述具体原因，程序判断使用 code；onProgress 自身抛出的异常保留原样。
 * @public
 */
export class UploadError extends Error {
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
   * @param code - 稳定错误码，用于程序判断。
   * @param status - HTTP 状态码，默认 0。
   * @param cause - 原始异常或取消原因。
   * @param reason - 可选的具体原因，追加到 message。
   */
  constructor(code: UploadError['code'], status = 0, cause?: unknown, reason?: string) {
    super(`Upload failed: ${code} (status ${status})${reason ? `: ${reason}` : ''}`);
    this.name = 'UploadError';
    this.code = code;
    this.status = status;
    this.cause = cause;
    Object.setPrototypeOf(this, UploadError.prototype);
  }
}

/**
 * 通过 POST/PUT 上传 FormData 或 Blob/File，支持请求头、进度和取消。
 *
 * @public
 * @param url - 上传地址；跨域时服务端须允许 CORS 和所需的预检请求。
 * @param body - FormData 原样发送；Blob/File 作为原始请求体，不自动包装表单。
 * @param options - 请求和响应配置，默认 POST、auto 和 JSON 响应。
 * @returns 等待服务端 2xx 响应并完成解析后兑现；失败时以 UploadError 拒绝。
 * onProgress 同步抛错时停止请求，并以原异常拒绝。
 * @remarks
 * 进度 done 仅表示请求体发送完成；成功与否由 Promise 表示。
 * 不自动重试，不执行分片、业务校验或响应结构校验。凭据采用默认同源策略。
 *
 * @example
 * 表单可包含多个文件和业务字段；有进度回调时自动使用 XHR：
 * ```ts
 * import { upload } from 'sculp-js/upload';
 *
 * const form = new FormData();
 * form.append('file', new File(['hello'], 'hello.txt', { type: 'text/plain' }));
 * form.append('folderId', '123');
 * try {
 *   const result = await upload('/api/files', form, {
 *     headers: { Authorization: 'Bearer YOUR_TOKEN' },
 *     onProgress({ loaded, percent, done }) {
 *       if (done) console.log('发送完成，等待服务器响应');
 *       else console.log(percent === undefined ? `${loaded} 字节` : `${percent.toFixed(1)}%`);
 *     }
 *   });
 *   console.log(result.status, result.data);
 * } catch (error) {
 *   console.error('上传失败', error);
 * }
 * ```
 *
 * @example
 * PUT 原始文件，支持无 JSON 正文的存储接口：
 * ```ts
 * import { upload } from 'sculp-js/upload';
 *
 * const file = new File(['hello'], 'hello.txt', { type: 'text/plain' });
 * upload('/api/storage/hello.txt', file, {
 *   method: 'PUT',
 *   responseType: 'text',
 *   headers: { 'Content-Type': file.type }
 * }).then(result => console.log(result.status)).catch(error => console.error(error));
 * ```
 *
 * @example
 * 取消发送或等待响应；业务界面可在取消按钮中调用 controller.abort()：
 * ```ts
 * import { upload, UploadError } from 'sculp-js/upload';
 *
 * const controller = new AbortController();
 * const task = upload('/api/files', new FormData(), { signal: controller.signal });
 * controller.abort();
 * try {
 *   await task;
 * } catch (error) {
 *   if (error instanceof UploadError && error.code === 'ABORTED') console.log('已取消');
 *   else console.error('上传失败', error);
 * }
 * ```
 */
export function upload<T = unknown>(
  url: string,
  body: FormData | Blob,
  options?: UploadOptions & { responseType?: 'json' }
): Promise<UploadResult<T>>;
/** @public */
export function upload(
  url: string,
  body: FormData | Blob,
  options: UploadOptions & { responseType: 'text' }
): Promise<UploadResult<string>>;
/** @public */
export function upload(
  url: string,
  body: FormData | Blob,
  options: UploadOptions & { responseType: 'blob' }
): Promise<UploadResult<Blob>>;
/** @public */
export function upload(url: string, body: FormData | Blob, options: UploadOptions): Promise<UploadResult>;
export function upload(url: string, body: FormData | Blob, options: UploadOptions = {}): Promise<UploadResult> {
  const { method = 'POST', headers, responseType = 'json', signal, transport, onProgress } = options;
  const error = (code: UploadError['code'], status: number, cause?: unknown, reason?: string) =>
    new UploadError(code, status, cause, reason);
  return transfer({
    url,
    method,
    body,
    headers,
    signal,
    transport,
    onProgress,
    direction: 'upload',
    responseType: responseType === 'blob' ? 'blob' : 'text',
    isSuccess: isHTTPSuccess,
    error,
    validate: () => {
      const tag = Object.prototype.toString.call(body);
      if (!['POST', 'PUT'].includes(method)) {
        throw new UploadError('INVALID_OPTIONS', 0, undefined, 'method must be "POST" or "PUT".');
      }
      if (!['json', 'text', 'blob'].includes(responseType)) {
        throw new UploadError('INVALID_OPTIONS', 0, undefined, 'responseType must be "json", "text", or "blob".');
      }
      if (!['[object FormData]', '[object Blob]', '[object File]'].includes(tag)) {
        throw new UploadError('INVALID_OPTIONS', 0, undefined, 'body must be a FormData, Blob, or File.');
      }
      if (tag === '[object FormData]') {
        forEachHeader(headers, name => {
          if (name.trim().toLowerCase() === 'content-type') {
            throw new UploadError(
              'INVALID_OPTIONS',
              0,
              new TypeError('FormData Content-Type must be generated by the transport'),
              'Do not set Content-Type for FormData; the browser must generate the multipart boundary.'
            );
          }
        });
      }
    },
    consume: response => consumeHTTPResponse(response, responseType, error)
  });
}

export default { upload, UploadError };
