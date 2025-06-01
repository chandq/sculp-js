import { isObject } from './type';

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
 * 计算图片压缩后的尺寸
 *
 * @param {number} maxWidth
 * @param {number} maxHeight
 * @param {number} originWidth
 * @param {number} originHeight
 * @returns {*}
 */
function calculateSize({
  maxWidth,
  maxHeight,
  originWidth,
  originHeight
}: {
  maxWidth: number;
  maxHeight: number;
  originWidth: number;
  originHeight: number;
}): { width: number; height: number } {
  let width = originWidth,
    height = originHeight;
  // 图片尺寸超过限制
  if (originWidth > maxWidth || originHeight > maxHeight) {
    if (originWidth / originHeight > maxWidth / maxHeight) {
      // 更宽，按照宽度限定尺寸
      width = maxWidth;
      height = Math.round(maxWidth * (originHeight / originWidth));
    } else {
      height = maxHeight;
      width = Math.round(maxHeight * (originWidth / originHeight));
    }
  }
  return { width, height };
}

/**
 * 根据原始图片的不同尺寸计算等比例缩放后的宽高尺寸
 *
 * @param {number} sizeKB
 * @param {number} originWidth
 * @param {number} originHeight
 * @returns {*}
 */
function scalingByAspectRatio({ sizeKB, originWidth, originHeight }): { width: number; height: number } {
  let targetWidth = originWidth,
    targetHeight = originHeight;
  if (sizeKB <= 500) {
    // [50KB, 500KB]
    const maxWidth = 1200,
      maxHeight = 1200;
    const { width, height } = calculateSize({ maxWidth, maxHeight, originWidth, originHeight });
    targetWidth = width;
    targetHeight = height;
  } else if (sizeKB < 10 * 1024) {
    // (500KB, 10MB)
    const maxWidth = 1600,
      maxHeight = 1600;
    const { width, height } = calculateSize({ maxWidth, maxHeight, originWidth, originHeight });
    targetWidth = width;
    targetHeight = height;
  } else if (10 * 1024 <= sizeKB) {
    // [10MB, Infinity)
    const maxWidth = originWidth > 15000 ? 8192 : originWidth > 10000 ? 4096 : 2048,
      maxHeight = originHeight > 15000 ? 8192 : originHeight > 10000 ? 4096 : 2048;

    const { width, height } = calculateSize({ maxWidth, maxHeight, originWidth, originHeight });
    targetWidth = width;
    targetHeight = height;
  }

  return { width: targetWidth, height: targetHeight };
}

/**
 * Web端：等比例压缩图片批量处理 (size小于200KB，不压缩)
 *
 * @param {File | FileList} file 图片或图片数组
 * @param {ICompressOptions} options 压缩图片配置项，default: {mime:'image/jpeg'}
 * @returns {Promise<object> | undefined}
 */
export function compressImg(
  file: File | FileList,
  options: ICompressOptions = { mime: 'image/jpeg' }
): Promise<object> | undefined {
  if (!(file instanceof File || file instanceof FileList)) {
    throw new Error(`${file} require be File or FileList`);
  } else if (!supportCanvas()) {
    throw new Error(`Current runtime environment not support Canvas`);
  }
  const { quality, mime = 'image/jpeg' }: ICompressOptions = isObject(options) ? options : {};

  let targetQuality = quality;
  if (quality) {
    targetQuality = quality;
  } else if (file instanceof File) {
    const sizeKB = +parseInt((file.size / 1024).toFixed(2));
    if (sizeKB < 1 * 50) {
      targetQuality = 1;
    } else if (sizeKB < 1 * 1024) {
      targetQuality = 0.85;
    } else if (sizeKB < 5 * 1024) {
      targetQuality = 0.8;
    } else {
      targetQuality = 0.75;
    }
  }

  if (file instanceof FileList) {
    return Promise.all(Array.from(file).map(el => compressImg(el, { mime: mime, quality: targetQuality }))); // 如果是 file 数组返回 Promise 数组
  } else if (file instanceof File) {
    return new Promise(resolve => {
      const ext = {
        'image/webp': 'webp',
        'image/jpeg': 'jpg',
        'image/png': 'png'
      };
      const fileName = [...file.name.split('.').slice(0, -1), ext[mime]].join('.');
      const sizeKB = +parseInt((file.size / 1024).toFixed(2));
      if (+(file.size / 1024).toFixed(2) < 50) {
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
            const originWidth = image.width;
            const originHeight = image.height;

            const { width, height } = scalingByAspectRatio({ sizeKB, originWidth, originHeight });

            canvas.width = width;
            canvas.height = height;
            context!.clearRect(0, 0, width, height);
            context!.drawImage(image, 0, 0, width, height); // 绘制 canvas
            const canvasURL = canvas.toDataURL(mime, targetQuality);
            const buffer = atob(canvasURL.split(',')[1]);
            let length = buffer.length;
            const bufferArray = new Uint8Array(new ArrayBuffer(length));
            while (length--) {
              bufferArray[length] = buffer.charCodeAt(length);
            }
            const miniFile = new File([bufferArray], fileName, {
              type: mime
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
