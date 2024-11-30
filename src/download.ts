import { LooseParams } from './qs';
import { AnyObject, isFunction } from './type';
import { urlSetParams } from './url';

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
  const eleLink = document.createElement('a');
  eleLink.download = filename;
  eleLink.style.display = 'none';
  eleLink.href = href;
  document.body.appendChild(eleLink);
  eleLink.click();
  setTimeout(() => {
    document.body.removeChild(eleLink);
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
 * 根据URL下载文件（解决跨域a.download不生效问题)
 * @param {string} url
 * @param {string} filename
 * @param {Function} callback
 */
export function crossOriginDownload(url: string, filename: string, callback?: Function): void {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'blob';
  xhr.onload = function () {
    if (xhr.status === 200) downloadBlob(xhr.response, filename, callback);
  };
  xhr.send();
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
