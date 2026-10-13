/* global HeadersInit */
import { LooseParams } from './qs';
import { AnyObject, isFunction } from './type';
import { urlSetParams } from './url';
import { transfer } from './internal/transfer';

/**
 * 通过打开新窗口的方式下载
 * @param {string} url
 * @param {LooseParams} params
 */
export function downloadURL(url: string, params?: LooseParams): void {
  window.open(params ? urlSetParams(url, params) : url);
}

/**
 * 通过 A 链接的方式下载
 * @param {string} href
 * @param {string} filename
 * @param {Function} callback
 */
export function downloadHref(href: string, filename: string, callback?: Function): void {
  let eleLink = document.createElement('a');
  eleLink.download = filename;
  eleLink.style.display = 'none';
  eleLink.href = href;
  document.body.appendChild(eleLink);
  eleLink.click();
  setTimeout(() => {
    document.body.removeChild(eleLink);
    // @ts-ignore
    eleLink = null;
    if (isFunction(callback)) {
      callback();
    }
  });
}

/**
 * 将大文件对象通过 A 链接的方式下载
 * @param {Blob} blob
 * @param {string} filename
 * @param {Function} callback
 */
export function downloadBlob(blob: Blob, filename: string, callback?: Function): void {
  const objURL = URL.createObjectURL(blob);

  downloadHref(objURL, filename);
  setTimeout(() => {
    URL.revokeObjectURL(objURL);
    if (isFunction(callback)) {
      callback();
    }
  });
}
/**
 * 下载响应体的接收进度，仅由 XHR 提供。
 * @public
 */
export interface DownloadProgress {
  /** 已接收字节数，使用浏览器原生传输统计口径。 */
  loaded: number;
  /** 总字节数；无法计算时为 undefined。 */
  total?: number;
  /** 0～100 的百分比；无法计算时为 undefined。 */
  percent?: number;
  /** 浏览器是否提供了有效的总字节数。 */
  lengthComputable: boolean;
  /** 响应体成功接收完成，不表示文件已保存到磁盘。 */
  done: boolean;
}

/**
 * 跨域下载选项，所有字段均可选。
 * @public
 */
export type CrossOriginDownloadParams = {
  /** 严格匹配的 HTTP 成功状态码，默认 200。 */
  successCode?: number;
  /** 请求头，支持普通对象、键值对数组及 Headers。 */
  headers?: HeadersInit;
  /** 下载进度；auto 模式下启用 XHR，与显式 fetch 冲突。仅支持同步回调，不做内置节流。 */
  onProgress?: (progress: DownloadProgress) => void;
  /** 取消信号；触发浏览器保存后取消无效。 */
  signal?: AbortSignal;
  /** 默认 auto：有进度回调时使用 XHR，否则优先 fetch。失败后不重试。 */
  transport?: 'auto' | 'fetch' | 'xhr';
};

/**
 * 下载失败；onProgress 抛出的异常保留原样，不转换为此类型。
 * @public
 */
export class CrossOriginDownloadError extends Error {
  /** HTTP 状态码；没有收到 HTTP 响应时为 0。 */
  readonly status: number;

  /** ERROR_CONNECTION_REFUSED 沿用历史命名，泛指网络或响应体传输失败。 */
  readonly code:
    | 'INVALID_OPTIONS'
    | 'UNSUPPORTED_ENVIRONMENT'
    | 'HTTP_ERROR'
    | 'ERROR_CONNECTION_REFUSED'
    | 'ABORTED'
    | 'DOWNLOAD_ERROR';

  /** HTTP 错误正文；JSON 保留原始文本，不自动解析。 */
  response?: string | Blob;

  /** 底层异常或取消原因。 */
  cause?: unknown;

  constructor(code: CrossOriginDownloadError['code'], status = 0, cause?: unknown) {
    super(`Download failed: ${code} (status ${status})`);
    this.name = 'CrossOriginDownloadError';
    this.code = code;
    this.status = status;
    this.cause = cause;
    // 声明构建允许 ES5 target，确保内置 Error 子类的 instanceof 正常。
    Object.setPrototypeOf(this, CrossOriginDownloadError.prototype);
  }
}

// 两种请求实现共用保存流程；不改变现有 downloadBlob/downloadHref 的公开行为。
function saveDownloadBlob(blob: Blob, filename: string, beforeClick: () => boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    let objectURL: string | undefined;
    let link: HTMLAnchorElement | undefined;
    let appended = false;
    const cleanup = () => {
      try {
        if (appended && link) document.body.removeChild(link);
      } finally {
        try {
          if (objectURL !== undefined) URL.revokeObjectURL(objectURL);
        } finally {
          link = undefined;
          objectURL = undefined;
          appended = false;
        }
      }
    };
    try {
      objectURL = URL.createObjectURL(blob);
      link = document.createElement('a');
      link.download = filename;
      link.style.display = 'none';
      link.href = objectURL;
      document.body.appendChild(link);
      appended = true;
      if (!beforeClick()) {
        cleanup();
        resolve();
        return;
      }
      link.click();
      setTimeout(() => {
        try {
          cleanup();
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      try {
        cleanup();
      } finally {
        reject(error);
      }
    }
  });
}

/**
 * 下载跨域资源并触发浏览器保存，支持请求头、XHR 进度和取消。
 *
 * @public
 *
 * @param url - GET 请求地址，服务端必须允许 CORS。
 * @param filename - 保存时建议使用的文件名。
 * @param options - 可选配置；默认 auto，无进度回调时优先 fetch。
 * @returns 触发保存并清理临时资源后兑现的 Promise。
 * 下载失败时以 CrossOriginDownloadError 拒绝；onProgress 抛错时以原异常拒绝。
 *
 * @remarks
 * 文件完整接收为 Blob 后触发保存；进度完成或 Promise 兑现均不表示已写入磁盘。
 * 使用 await 或 then/catch 处理结果，不再支持成功、失败回调。
 *
 * @example
 * 基础下载并处理失败：
 * ```ts
 * import { crossOriginDownload } from 'sculp-js/download';
 *
 * try {
 *   await crossOriginDownload('/api/export', 'report.xlsx');
 * } catch (error) {
 *   console.error('下载失败', error);
 * }
 * ```
 *
 * @example
 * 鉴权与进度，auto 自动使用 XHR，总量未知时展示已接收字节数：
 * ```ts
 * import { crossOriginDownload } from 'sculp-js/download';
 *
 * try {
 *   await crossOriginDownload('/api/export', 'report.xlsx', {
 *     headers: { Authorization: 'Bearer YOUR_TOKEN' },
 *     onProgress({ loaded, percent, done }) {
 *       if (done) console.log('接收完成，准备保存');
 *       else if (percent !== undefined) console.log(`已下载 ${percent.toFixed(1)}%`);
 *       else console.log(`已接收 ${loaded} 字节`);
 *     }
 *   });
 * } catch (error) {
 *   console.error('下载失败', error);
 * }
 * ```
 *
 * @example
 * 用户取消；触发浏览器保存后 abort 无效：
 * ```ts
 * import { crossOriginDownload, CrossOriginDownloadError } from 'sculp-js/download';
 *
 * const controller = new AbortController();
 * const cancelButton = document.querySelector<HTMLButtonElement>('#cancel-download');
 * const cancel = () => controller.abort();
 * cancelButton?.addEventListener('click', cancel);
 * try {
 *   await crossOriginDownload('/api/export', 'report.xlsx', { signal: controller.signal });
 * } catch (error) {
 *   if (error instanceof CrossOriginDownloadError && error.code === 'ABORTED') {
 *     console.log('下载已取消');
 *   } else {
 *     console.error('下载失败', error);
 *   }
 * } finally {
 *   cancelButton?.removeEventListener('click', cancel);
 * }
 * ```
 *
 * @example
 * 通过 Promise 链处理成功和失败：
 * ```ts
 * import { crossOriginDownload } from 'sculp-js/download';
 *
 * crossOriginDownload('/api/export', 'report.xlsx')
 *   .then(() => console.log('已触发保存'))
 *   .catch(error => console.error('下载失败', error));
 * ```
 */
export function crossOriginDownload(url: string, filename: string, options?: CrossOriginDownloadParams): Promise<void> {
  const { successCode = 200, headers, onProgress, signal, transport = 'auto' } = options ?? {};

  return transfer({
    url,
    method: 'GET',
    headers,
    signal,
    transport,
    onProgress,
    direction: 'download',
    responseType: 'blob',
    isSuccess: status => status === successCode,
    error: (code, status, cause) =>
      new CrossOriginDownloadError(code === 'NETWORK_ERROR' ? 'ERROR_CONNECTION_REFUSED' : code, status, cause),
    validate: () => {
      if (
        typeof document === 'undefined' ||
        typeof URL === 'undefined' ||
        typeof URL.createObjectURL !== 'function' ||
        typeof URL.revokeObjectURL !== 'function'
      ) {
        throw new CrossOriginDownloadError('UNSUPPORTED_ENVIRONMENT');
      }
    },
    consume: async ({ status, body, contentType }, context) => {
      const blob = body as Blob;
      if (status !== successCode) {
        const error = new CrossOriginDownloadError('HTTP_ERROR', status);
        error.response = blob;
        if (contentType?.toLowerCase().includes('application/json')) {
          try {
            error.response = await context.readText(blob);
          } catch (cause) {
            error.cause = cause;
          }
        }
        throw error;
      }
      try {
        await saveDownloadBlob(blob, filename, context.commit);
      } catch (cause) {
        throw new CrossOriginDownloadError('DOWNLOAD_ERROR', status, cause);
      }
    }
  });
}

export type FileType = 'json' | 'csv' | 'xls' | 'xlsx';

/**
 * 将指定数据格式通过 A 链接的方式下载
 * @param {AnyObject | AnyObject[]} data
 * @param {FileType} fileType 支持 json/csv/xls/xlsx 四种格式
 * @param {string} filename
 * @param {string[]} [headers]
 */
export function downloadData(
  data: AnyObject | AnyObject[],
  fileType: FileType,
  filename: string,
  headers?: string[]
): void {
  filename = filename.replace(`.${fileType}`, '') + `.${fileType}`;

  if (fileType === 'json') {
    const blob = new Blob([JSON.stringify(data, null, 4)]);
    downloadBlob(blob, filename);
  } else {
    // xlsx实际生成的也为csv，仅后缀名名不同
    if (!headers || !headers.length) throw new Error('未传入表头数据');

    if (!Array.isArray(data)) throw new Error('data error! expected array!');

    const headerStr = headers.join(',') + '\n';

    let bodyStr = '';

    data.forEach(row => {
      // \t防止数字被科学计数法显示
      bodyStr += Object.values(row).join(',\t') + ',\n';
    });

    const MIMETypes = {
      csv: 'text/csv',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
    // encodeURIComponent解决中文乱码
    const href = 'data:' + MIMETypes[fileType] + ';charset=utf-8,\ufeff' + encodeURIComponent(headerStr + bodyStr);
    downloadHref(href, filename);
  }
}

export default {
  downloadURL,
  downloadHref,
  downloadBlob,
  crossOriginDownload,
  downloadData
};
