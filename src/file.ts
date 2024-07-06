import { weAtob } from './we-decode';

/**
 * 判断是否支持canvas
 * @returns {boolean}
 */
export function supportCanvas(): boolean {
  return !!document.createElement('canvas').getContext;
}

/**
 * 选择本地文件
 * @param {string} accept 上传的文件类型，用于过滤
 * @param {Function} changeCb 选择文件回调
 * @returns {HTMLInputElement}
 */
export function chooseLocalFile(accept: string, changeCb: (FileList) => any): HTMLInputElement {
  const inputObj: HTMLInputElement = document.createElement('input');
  inputObj.setAttribute('id', String(Date.now()));
  inputObj.setAttribute('type', 'file');
  inputObj.setAttribute('style', 'visibility:hidden');
  inputObj.setAttribute('accept', accept);
  document.body.appendChild(inputObj);
  inputObj.click();
  // @ts-ignore
  inputObj.onchange = (e: PointerEvent): any => {
    changeCb((<HTMLInputElement>e.target).files);

    setTimeout(() => document.body.removeChild(inputObj));
  };
  return inputObj;
}

type ImageType = 'image/jpeg' | 'image/png' | 'image/webp';

export interface ICompressOptions {
  /** 压缩质量 0 ~ 1 之间*/
  quality?: number;
  /** 图片类型 */
  mime?: ImageType;
}

/**
 * Web端：等比例压缩图片批量处理 (size小于200KB，不压缩)
 * @param {File | FileList} file 文件
 * @param {ICompressOptions} options
 * @returns {Promise<object> | undefined}
 */
export function compressImg(file: File | FileList, options: ICompressOptions): Promise<object> | undefined {
  console.assert(file instanceof File || file instanceof FileList, `${file} 必须是File或FileList类型`);
  console.assert(supportCanvas(), `当前环境不支持 Canvas`);
  let targetQuality = 0.52;
  if (file instanceof File) {
    const sizeKB = +parseInt((file.size / 1024).toFixed(2));
    if (sizeKB < 1 * 1024) {
      targetQuality = 0.85;
    } else if (sizeKB >= 1 * 1024 && sizeKB < 5 * 1024) {
      targetQuality = 0.62;
    } else if (sizeKB >= 5 * 1024) {
      targetQuality = 0.52;
    }
  }
  if (options.quality) {
    targetQuality = options.quality;
  }
  if (file instanceof FileList) {
    return Promise.all(Array.from(file).map(el => compressImg(el, { mime: options.mime, quality: targetQuality }))); // 如果是 file 数组返回 Promise 数组
  } else if (file instanceof File) {
    return new Promise(resolve => {
      const sizeKB = +parseInt((file.size / 1024).toFixed(2));
      if (+(file.size / 1024).toFixed(2) < 200) {
        resolve({
          file: file
        });
      } else {
        const reader = new FileReader(); // 创建 FileReader
        // @ts-ignore
        reader.onload = ({ target: { result: src } }) => {
          const image = new Image(); // 创建 img 元素
          image.onload = () => {
            const canvas = document.createElement('canvas'); // 创建 canvas 元素
            const context = canvas.getContext('2d');
            let targetWidth = image.width;
            let targetHeight = image.height;
            const originWidth = image.width;
            const originHeight = image.height;
            if (1 * 1024 <= sizeKB && sizeKB < 10 * 1024) {
              const maxWidth = 1600,
                maxHeight = 1600;
              targetWidth = originWidth;
              targetHeight = originHeight;
              // 图片尺寸超过的限制
              if (originWidth > maxWidth || originHeight > maxHeight) {
                if (originWidth / originHeight > maxWidth / maxHeight) {
                  // 更宽，按照宽度限定尺寸
                  targetWidth = maxWidth;
                  targetHeight = Math.round(maxWidth * (originHeight / originWidth));
                } else {
                  targetHeight = maxHeight;
                  targetWidth = Math.round(maxHeight * (originWidth / originHeight));
                }
              }
            }
            if (10 * 1024 <= sizeKB && sizeKB <= 20 * 1024) {
              const maxWidth = 1400,
                maxHeight = 1400;
              targetWidth = originWidth;
              targetHeight = originHeight;
              // 图片尺寸超过的限制
              if (originWidth > maxWidth || originHeight > maxHeight) {
                if (originWidth / originHeight > maxWidth / maxHeight) {
                  // 更宽，按照宽度限定尺寸
                  targetWidth = maxWidth;
                  targetHeight = Math.round(maxWidth * (originHeight / originWidth));
                } else {
                  targetHeight = maxHeight;
                  targetWidth = Math.round(maxHeight * (originWidth / originHeight));
                }
              }
            }
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            context!.clearRect(0, 0, targetWidth, targetHeight);
            context!.drawImage(image, 0, 0, targetWidth, targetHeight); // 绘制 canvas
            const canvasURL = canvas.toDataURL(options.mime, targetQuality);
            const buffer = weAtob(canvasURL.split(',')[1]);
            let length = buffer.length;
            const bufferArray = new Uint8Array(new ArrayBuffer(length));
            while (length--) {
              bufferArray[length] = buffer.charCodeAt(length);
            }
            const miniFile = new File([bufferArray], file.name, {
              type: options.mime
            });
            resolve({
              file: miniFile,
              bufferArray,
              origin: file,
              beforeSrc: src,
              afterSrc: canvasURL,
              beforeKB: Number((file.size / 1024).toFixed(2)),
              afterKB: Number((miniFile.size / 1024).toFixed(2))
            });
          };
          image.src = src;
        };
        reader.readAsDataURL(file);
      }
    });
  }
}
