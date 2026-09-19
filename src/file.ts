import { isObject } from './type';

/**
 * 判断是否支持 Canvas 2D 上下文
 * @returns {boolean}
 */
export function supportCanvas(): boolean {
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') return false;
  try {
    const canvas = document.createElement('canvas');
    return typeof canvas.getContext === 'function' && canvas.getContext('2d') !== null;
  } catch {
    return false;
  }
}

/**
 * 选择本地文件
 * @param {string} accept 上传的文件类型，用于过滤
 * @param {Function} changeCb 选择文件回调
 */
export function chooseLocalFile(accept: string, changeCb: (files: FileList) => any): void {
  let inputObj: HTMLInputElement | null = document.createElement('input');
  inputObj.setAttribute('id', String(Date.now()));
  inputObj.setAttribute('type', 'file');
  inputObj.setAttribute('style', 'visibility:hidden');
  inputObj.setAttribute('accept', accept);
  document.body.appendChild(inputObj);
  inputObj.click();
  inputObj.onchange = event => {
    const input = event.target as HTMLInputElement;
    if (input.files) changeCb(input.files);

    setTimeout(() => {
      if (inputObj?.parentNode) inputObj.parentNode.removeChild(inputObj);
      inputObj = null;
    });
  };
}

export type ImageType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif';
type CompressOutputMode = 'legacy' | 'compact';
export type ImageCompressionPreset = 'balanced' | 'social' | 'high-quality' | 'thumbnail' | 'long-image';

export interface ICompressOptions {
  /** 业务场景预设，显式传入的其他选项优先级更高，默认 balanced */
  preset?: ImageCompressionPreset;
  /** 压缩质量，取值范围 0 ~ 1；PNG 通常忽略该参数 */
  quality?: number;
  /** 输出图片类型，默认 image/jpeg */
  mime?: ImageType;
  /** 最大宽度；仅设置该值时不使用默认高度限制 */
  maxWidth?: number;
  /** 最大高度；仅设置该值时不使用默认宽度限制 */
  maxHeight?: number;
  /** 最大宽高的兼容配置，等价于同时设置 maxWidth 和 maxHeight */
  maxSize?: number;
  /** 小于该体积时不压缩，默认 50KB */
  minFileSizeKB?: number;
  /** 输出图片最大像素数，默认约 8.4MP，用于避免大 Canvas 造成 OOM */
  maxPixels?: number;
  /** Canvas 单边的安全上限，默认 8192px；受限 WebView 可主动降为 4096 */
  maxCanvasDimension?: number;
  /** 是否在宽高比达到 3:1 时放宽长边限制，默认由 preset 决定 */
  preserveLongImage?: boolean;
  /** 期望的最大文件体积，单位 KB；会迭代调整质量，必要时继续缩小尺寸 */
  targetFileSizeKB?: number | null;
  /** 迭代压缩的最低质量，默认由 preset 决定 */
  minQuality?: number;
  /** 目标体积压缩的最大编码次数，默认 8 */
  maxIterations?: number;
  /** FileList 的最大并发数，默认 2 */
  concurrency?: number;
  /**
   * legacy 保留 Data URL、Uint8Array 等旧返回字段；compact 仅返回必要信息，显著降低内存占用。
   * 默认 legacy，以保持向后兼容。
   */
  outputMode?: CompressOutputMode;
  /** 未缩放且输出不小于原文件时返回原文件，默认 true */
  keepOriginalIfLarger?: boolean;
  /** 输出 JPEG 时透明像素的背景色，默认 #fff */
  backgroundColor?: string;
  /** 输出格式不被运行环境支持时是否拒绝，默认 false（接受 Canvas 回退格式） */
  strictMime?: boolean;
  /** 压缩进度回调，取值 0 ~ 100 */
  onProgress?: (progress: number) => void;
  /** 用于取消单图或批量压缩 */
  signal?: AbortSignal;
  /** 当输入为 Blob 时使用的文件名，默认 image */
  fileName?: string;
}

export interface ICompressImgResult {
  file: File;
  bufferArray?: Uint8Array;
  origin?: File;
  beforeSrc?: string;
  afterSrc?: string;
  beforeKB?: number;
  afterKB?: number;
  width?: number;
  height?: number;
  mime?: string;
  compressed?: boolean;
  quality?: number;
  iterations?: number;
  targetAchieved?: boolean;
}

interface NormalizedCompressOptions {
  preset: ImageCompressionPreset;
  quality: number;
  mime: ImageType;
  maxWidth?: number;
  maxHeight?: number;
  minFileSizeKB: number;
  maxPixels: number;
  maxCanvasDimension: number;
  preserveLongImage: boolean;
  targetFileSizeKB?: number;
  minQuality: number;
  maxIterations: number;
  concurrency: number;
  outputMode: CompressOutputMode;
  keepOriginalIfLarger: boolean;
  backgroundColor: string;
  strictMime: boolean;
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
  fileName: string;
}

interface DecodedImage {
  source: HTMLImageElement | ImageBitmap;
  width: number;
  height: number;
  release: () => void;
}

export interface CompressionPresetOptions {
  quality: number;
  minQuality: number;
  maxWidth?: number;
  maxHeight?: number;
  maxPixels: number;
  targetFileSizeKB?: number;
  preserveLongImage?: boolean;
}

const IMAGE_TYPES: ImageType[] = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const DEFAULT_MAX_EDGE = 2560;
const DEFAULT_MAX_PIXELS = 8 * 1024 * 1024;
const LONG_IMAGE_RATIO = 3;
const DEFAULT_MAX_CANVAS_DIMENSION = 8192;
const DEFAULT_MAX_ITERATIONS = 8;

export const IMAGE_COMPRESSION_PRESETS: Readonly<Record<ImageCompressionPreset, Readonly<CompressionPresetOptions>>> = {
  balanced: {
    quality: 0.82,
    minQuality: 0.6,
    maxWidth: 1920,
    maxHeight: 1920,
    maxPixels: 6 * 1024 * 1024,
    targetFileSizeKB: 500,
    preserveLongImage: true
  },
  social: {
    quality: 0.82,
    minQuality: 0.62,
    maxWidth: 1280,
    maxHeight: 1280,
    maxPixels: 4 * 1024 * 1024,
    targetFileSizeKB: 300,
    preserveLongImage: true
  },
  'high-quality': {
    quality: 0.88,
    minQuality: 0.72,
    maxWidth: 2560,
    maxHeight: 2560,
    maxPixels: DEFAULT_MAX_PIXELS,
    targetFileSizeKB: 1024,
    preserveLongImage: true
  },
  thumbnail: {
    quality: 0.78,
    minQuality: 0.58,
    maxWidth: 400,
    maxHeight: 400,
    maxPixels: 400 * 400,
    targetFileSizeKB: 30
  },
  'long-image': {
    quality: 0.82,
    minQuality: 0.65,
    maxWidth: 1080,
    maxHeight: DEFAULT_MAX_CANVAS_DIMENSION,
    maxPixels: 12 * 1024 * 1024,
    preserveLongImage: true
  }
};

function isFile(value: unknown): value is File {
  return (
    (typeof File !== 'undefined' && value instanceof File) || Object.prototype.toString.call(value) === '[object File]'
  );
}

function isFileList(value: unknown): value is FileList {
  return (
    (typeof FileList !== 'undefined' && value instanceof FileList) ||
    Object.prototype.toString.call(value) === '[object FileList]'
  );
}

function isBlob(value: unknown): value is Blob {
  return (
    (typeof Blob !== 'undefined' && value instanceof Blob) || Object.prototype.toString.call(value) === '[object Blob]'
  );
}

function createAbortError(): Error {
  if (typeof DOMException !== 'undefined') return new DOMException('Image compression aborted', 'AbortError');
  const error = new Error('Image compression aborted');
  error.name = 'AbortError';
  return error;
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw createAbortError();
}

function assertFiniteNumber(value: unknown, name: string, min: number, max = Infinity): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new RangeError(`${name} must be a finite number between ${min} and ${max}`);
  }
}

function normalizeOptions(options: ICompressOptions): NormalizedCompressOptions {
  const value: ICompressOptions = isObject(options) ? options : {};
  const {
    preset = 'balanced',
    quality: configuredQuality,
    mime = 'image/jpeg',
    maxWidth,
    maxHeight,
    maxSize,
    minFileSizeKB = 50,
    maxPixels: configuredMaxPixels,
    maxCanvasDimension = DEFAULT_MAX_CANVAS_DIMENSION,
    preserveLongImage: configuredPreserveLongImage,
    targetFileSizeKB: configuredTargetFileSizeKB,
    minQuality: configuredMinQuality,
    maxIterations = DEFAULT_MAX_ITERATIONS,
    concurrency = 2,
    outputMode = 'legacy',
    keepOriginalIfLarger = true,
    backgroundColor = '#fff',
    strictMime = false,
    onProgress,
    signal,
    fileName = 'image'
  } = value;
  const presetOptions = IMAGE_COMPRESSION_PRESETS[preset];
  if (!presetOptions) throw new TypeError(`Unsupported image compression preset: ${String(preset)}`);

  const quality = configuredQuality ?? presetOptions.quality;
  const minQuality = configuredMinQuality ?? Math.min(presetOptions.minQuality, quality);
  const maxPixels = configuredMaxPixels ?? presetOptions.maxPixels;
  const targetFileSizeKB =
    configuredTargetFileSizeKB === null ? undefined : configuredTargetFileSizeKB ?? presetOptions.targetFileSizeKB;
  const hasExplicitDimensions = maxWidth !== undefined || maxHeight !== undefined || maxSize !== undefined;
  const resolvedMaxWidth = hasExplicitDimensions ? maxWidth ?? maxSize : presetOptions.maxWidth;
  const resolvedMaxHeight = hasExplicitDimensions ? maxHeight ?? maxSize : presetOptions.maxHeight;
  const preserveLongImage =
    configuredPreserveLongImage ?? (!hasExplicitDimensions && !!presetOptions.preserveLongImage);

  assertFiniteNumber(quality, 'quality', 0, 1);
  assertFiniteNumber(minQuality, 'minQuality', 0, 1);
  if (minQuality > quality) throw new RangeError('minQuality must not be greater than quality');
  if (!IMAGE_TYPES.includes(mime)) throw new TypeError(`Unsupported image mime type: ${String(mime)}`);
  if (resolvedMaxWidth !== undefined) assertFiniteNumber(resolvedMaxWidth, 'maxWidth', 1);
  if (resolvedMaxHeight !== undefined) assertFiniteNumber(resolvedMaxHeight, 'maxHeight', 1);
  if (maxSize !== undefined) assertFiniteNumber(maxSize, 'maxSize', 1);
  assertFiniteNumber(minFileSizeKB, 'minFileSizeKB', 0);
  assertFiniteNumber(maxPixels, 'maxPixels', 1);
  assertFiniteNumber(maxCanvasDimension, 'maxCanvasDimension', 1);
  if (targetFileSizeKB !== undefined) assertFiniteNumber(targetFileSizeKB, 'targetFileSizeKB', 1);
  assertFiniteNumber(maxIterations, 'maxIterations', 1);
  assertFiniteNumber(concurrency, 'concurrency', 1);
  if (typeof keepOriginalIfLarger !== 'boolean') {
    throw new TypeError('keepOriginalIfLarger must be a boolean');
  }
  if (typeof backgroundColor !== 'string') throw new TypeError('backgroundColor must be a string');
  if (typeof strictMime !== 'boolean') throw new TypeError('strictMime must be a boolean');
  if (typeof preserveLongImage !== 'boolean') throw new TypeError('preserveLongImage must be a boolean');
  if (onProgress !== undefined && typeof onProgress !== 'function') {
    throw new TypeError('onProgress must be a function');
  }
  if (typeof fileName !== 'string' || fileName.length === 0) throw new TypeError('fileName must be a non-empty string');
  if (outputMode !== 'legacy' && outputMode !== 'compact') {
    throw new TypeError(`outputMode must be "legacy" or "compact"`);
  }

  return {
    preset,
    quality,
    mime,
    maxWidth: resolvedMaxWidth === undefined ? undefined : Math.floor(resolvedMaxWidth),
    maxHeight: resolvedMaxHeight === undefined ? undefined : Math.floor(resolvedMaxHeight),
    minFileSizeKB,
    maxPixels: Math.floor(maxPixels),
    maxCanvasDimension: Math.floor(maxCanvasDimension),
    preserveLongImage,
    targetFileSizeKB,
    minQuality,
    maxIterations: Math.max(1, Math.floor(maxIterations)),
    concurrency: Math.max(1, Math.floor(concurrency)),
    outputMode,
    keepOriginalIfLarger,
    backgroundColor,
    strictMime,
    onProgress,
    signal,
    fileName
  };
}

function blobToFile(blob: Blob, fileName: string): File {
  return new File([blob], fileName, { type: blob.type, lastModified: Date.now() });
}

function calculateTargetSize(
  maxWidth: number | undefined,
  maxHeight: number | undefined,
  maxPixels: number,
  maxCanvasDimension: number,
  preserveLongImage: boolean,
  originWidth: number,
  originHeight: number
): { width: number; height: number } {
  let targetMaxWidth = maxWidth;
  let targetMaxHeight = maxHeight;

  if (targetMaxWidth === undefined && targetMaxHeight === undefined) {
    targetMaxWidth = DEFAULT_MAX_EDGE;
    targetMaxHeight = DEFAULT_MAX_EDGE;
  }

  const aspectRatio = Math.max(originWidth / originHeight, originHeight / originWidth);
  if (preserveLongImage && aspectRatio >= LONG_IMAGE_RATIO) {
    if (originWidth >= originHeight) targetMaxWidth = maxCanvasDimension;
    else targetMaxHeight = maxCanvasDimension;
  }

  targetMaxWidth = Math.min(targetMaxWidth ?? maxCanvasDimension, maxCanvasDimension);
  targetMaxHeight = Math.min(targetMaxHeight ?? maxCanvasDimension, maxCanvasDimension);
  const dimensionScale = Math.min(1, targetMaxWidth / originWidth, targetMaxHeight / originHeight);
  const pixelScale = Math.min(1, Math.sqrt(maxPixels / (originWidth * originHeight)));
  const scale = Math.min(dimensionScale, pixelScale);

  return {
    width: Math.max(1, Math.floor(originWidth * scale)),
    height: Math.max(1, Math.floor(originHeight * scale))
  };
}

function readBlob(blob: Blob, mode: 'dataURL', signal?: AbortSignal): Promise<string>;
function readBlob(blob: Blob, mode: 'arrayBuffer', signal?: AbortSignal): Promise<ArrayBuffer>;
function readBlob(blob: Blob, mode: 'dataURL' | 'arrayBuffer', signal?: AbortSignal): Promise<string | ArrayBuffer> {
  return new Promise((resolve, reject) => {
    throwIfAborted(signal);
    const reader = new FileReader();
    let settled = false;
    const cleanup = () => {
      reader.onerror = null;
      reader.onabort = null;
      reader.onload = null;
      signal?.removeEventListener('abort', abort);
    };
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };
    const abort = () => {
      try {
        reader.abort();
      } finally {
        fail(createAbortError());
      }
    };
    reader.onerror = () => fail(reader.error ?? new Error('Failed to read image data'));
    reader.onabort = () => fail(createAbortError());
    reader.onload = () => {
      if (settled) return;
      const result = reader.result;
      if (mode === 'dataURL' && typeof result === 'string') {
        settled = true;
        cleanup();
        resolve(result);
      } else if (mode === 'arrayBuffer' && result instanceof ArrayBuffer) {
        settled = true;
        cleanup();
        resolve(result);
      } else fail(new Error(`Unexpected FileReader result for ${mode}`));
    };
    signal?.addEventListener('abort', abort, { once: true });
    if (mode === 'dataURL') reader.readAsDataURL(blob);
    else reader.readAsArrayBuffer(blob);
  });
}

async function decodeImage(file: File, signal?: AbortSignal): Promise<DecodedImage> {
  throwIfAborted(signal);
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      try {
        throwIfAborted(signal);
        if (!bitmap.width || !bitmap.height) throw new Error('Decoded image has invalid dimensions');
      } catch (error) {
        bitmap.close();
        throw error;
      }
      return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
    } catch (error) {
      if ((error as Error).name === 'AbortError') throw error;
    }
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    let objectURL: string | undefined;
    let settled = false;

    const cleanup = () => {
      image.onload = null;
      image.onerror = null;
      signal?.removeEventListener('abort', abort);
      if (objectURL && typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(objectURL);
    };
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };
    const abort = () => fail(createAbortError());

    image.onload = () => {
      if (settled) return;
      settled = true;
      const width = image.naturalWidth || image.width;
      const height = image.naturalHeight || image.height;
      cleanup();
      if (!width || !height) reject(new Error('Decoded image has invalid dimensions'));
      else resolve({ source: image, width, height, release: () => undefined });
    };
    image.onerror = () => fail(new Error(`Failed to decode image: ${file.name}`));
    signal?.addEventListener('abort', abort, { once: true });

    try {
      if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
        objectURL = URL.createObjectURL(file);
        image.src = objectURL;
      } else {
        readBlob(file, 'dataURL', signal).then(src => (image.src = src), fail);
      }
    } catch (error) {
      fail(error instanceof Error ? error : new Error(String(error)));
    }
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: ImageType, quality: number): Promise<Blob> {
  if (typeof canvas.toBlob === 'function') {
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('Canvas image encoding failed'))), mime, quality);
    });
  }

  try {
    const dataURL = canvas.toDataURL(mime, quality);
    const [header, encoded = ''] = dataURL.split(',');
    const actualMime = (/^data:([^;]+)/.exec(header)?.[1] || mime) as ImageType;
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
    return Promise.resolve(new Blob([bytes], { type: actualMime }));
  } catch (error) {
    return Promise.reject(error);
  }
}

function normalizeMime(mime: string): ImageType | undefined {
  if (mime === 'image/jpg') return 'image/jpeg';
  return IMAGE_TYPES.includes(mime as ImageType) ? (mime as ImageType) : undefined;
}

function replaceFileExtension(name: string, mime: ImageType): string {
  const extension: Record<ImageType, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/avif': 'avif'
  };
  const dotIndex = name.lastIndexOf('.');
  const baseName = dotIndex > 0 ? name.slice(0, dotIndex) : name || 'image';
  return `${baseName}.${extension[mime]}`;
}

interface CanvasEncodingResult {
  blob: Blob;
  mime: ImageType;
  quality: number;
  iterations: number;
}

interface ImageEncodingResult extends CanvasEncodingResult {
  width: number;
  height: number;
}

function reportProgress(options: NormalizedCompressOptions, progress: number): void {
  if (!options.onProgress) return;
  try {
    options.onProgress(Math.max(0, Math.min(100, Math.round(progress))));
  } catch {
    // 进度回调不应影响压缩主流程。
  }
}

function requiresCompression(file: File, options: NormalizedCompressOptions): boolean {
  const sizeKB = file.size / 1024;
  return (
    sizeKB >= options.minFileSizeKB || (options.targetFileSizeKB !== undefined && sizeKB > options.targetFileSizeKB)
  );
}

function supportsLossyQuality(mime: ImageType): boolean {
  return mime === 'image/jpeg' || mime === 'image/webp' || mime === 'image/avif';
}

function getEncodedMime(blob: Blob, requestedMime: ImageType, strictMime: boolean): ImageType {
  const actualMime = normalizeMime(blob.type);
  if (!actualMime) throw new Error(`Canvas returned unsupported image mime type: ${blob.type || 'unknown'}`);
  if (strictMime && actualMime !== requestedMime) {
    throw new Error(`Current runtime does not support encoding ${requestedMime}; received ${actualMime} instead`);
  }
  return actualMime;
}

async function encodeCanvas(
  canvas: HTMLCanvasElement,
  options: NormalizedCompressOptions,
  targetBytes: number | undefined,
  remainingIterations: number,
  completedIterations: number
): Promise<CanvasEncodingResult> {
  let iterations = 0;
  const encode = async (quality: number): Promise<{ blob: Blob; mime: ImageType; quality: number }> => {
    throwIfAborted(options.signal);
    const blob = await canvasToBlob(canvas, options.mime, quality);
    iterations++;
    reportProgress(options, 10 + ((completedIterations + iterations) / options.maxIterations) * 80);
    return { blob, mime: getEncodedMime(blob, options.mime, options.strictMime), quality };
  };

  const result = await encode(options.quality);
  if (
    targetBytes === undefined ||
    result.blob.size <= targetBytes ||
    !supportsLossyQuality(result.mime) ||
    remainingIterations <= 1 ||
    options.quality <= options.minQuality
  ) {
    return { ...result, iterations };
  }

  const minimumQualityResult = await encode(options.minQuality);
  if (minimumQualityResult.blob.size > targetBytes) {
    return { ...minimumQualityResult, iterations };
  }

  let bestResult = minimumQualityResult;
  let lowerQuality = options.minQuality;
  let upperQuality = options.quality;
  const searchIterations = remainingIterations - iterations;
  for (let index = 0; index < searchIterations && upperQuality - lowerQuality > 0.01; index++) {
    const nextQuality = (lowerQuality + upperQuality) / 2;
    const nextResult = await encode(nextQuality);
    if (nextResult.blob.size <= targetBytes) {
      bestResult = nextResult;
      lowerQuality = nextQuality;
    } else {
      upperQuality = nextQuality;
    }
  }
  return { ...bestResult, iterations };
}

async function encodeImage(
  decoded: DecodedImage,
  initialWidth: number,
  initialHeight: number,
  options: NormalizedCompressOptions,
  targetBytes: number | undefined
): Promise<ImageEncodingResult> {
  let width = initialWidth;
  let height = initialHeight;
  let totalIterations = 0;
  let lastResult: CanvasEncodingResult | undefined;

  while (totalIterations < options.maxIterations) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Failed to create Canvas 2D context');

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    if (options.mime === 'image/jpeg') {
      context.fillStyle = options.backgroundColor;
      context.fillRect(0, 0, width, height);
    }
    context.drawImage(decoded.source, 0, 0, width, height);
    throwIfAborted(options.signal);

    try {
      lastResult = await encodeCanvas(
        canvas,
        options,
        targetBytes,
        options.maxIterations - totalIterations,
        totalIterations
      );
      totalIterations += lastResult.iterations;
    } finally {
      // 尽早释放 Canvas 背后的像素缓冲区，批量处理时可显著降低内存峰值。
      canvas.width = 1;
      canvas.height = 1;
    }

    if (targetBytes === undefined || lastResult.blob.size <= targetBytes || totalIterations >= options.maxIterations) {
      return { ...lastResult, width, height, iterations: totalIterations };
    }

    const targetScale = Math.min(0.9, Math.sqrt(targetBytes / lastResult.blob.size) * 0.95);
    const nextWidth = Math.max(1, Math.floor(width * targetScale));
    const nextHeight = Math.max(1, Math.floor(height * targetScale));
    if ((nextWidth === width && nextHeight === height) || (width === 1 && height === 1)) {
      return { ...lastResult, width, height, iterations: totalIterations };
    }
    width = nextWidth;
    height = nextHeight;
  }

  if (!lastResult) throw new Error('Image encoding did not produce a result');
  return { ...lastResult, width, height, iterations: totalIterations };
}

async function compressOne(
  file: File,
  options: NormalizedCompressOptions,
  canvasSupported: boolean
): Promise<ICompressImgResult> {
  reportProgress(options, 0);
  throwIfAborted(options.signal);
  if (file.type && !file.type.startsWith('image/')) throw new TypeError(`${file.name} is not an image file`);

  const beforeKB = file.size / 1024;
  if (!requiresCompression(file, options)) {
    reportProgress(options, 100);
    return { file };
  }
  if (!canvasSupported) throw new Error('Current runtime environment not support Canvas');

  const decoded = await decodeImage(file, options.signal);
  try {
    reportProgress(options, 8);
    throwIfAborted(options.signal);
    const targetSize = calculateTargetSize(
      options.maxWidth,
      options.maxHeight,
      options.maxPixels,
      options.maxCanvasDimension,
      options.preserveLongImage,
      decoded.width,
      decoded.height
    );
    const configuredTargetBytes = options.targetFileSizeKB === undefined ? undefined : options.targetFileSizeKB * 1024;
    const sourceMime = normalizeMime(file.type);
    const dimensionsInitiallyUnchanged = targetSize.width === decoded.width && targetSize.height === decoded.height;
    const originalSizeTargetBytes =
      options.keepOriginalIfLarger && dimensionsInitiallyUnchanged && sourceMime === options.mime
        ? Math.max(0, file.size - 1)
        : undefined;
    const encodingTargetBytes =
      configuredTargetBytes === undefined
        ? originalSizeTargetBytes
        : originalSizeTargetBytes === undefined
        ? configuredTargetBytes
        : Math.min(configuredTargetBytes, originalSizeTargetBytes);
    const encoded = await encodeImage(decoded, targetSize.width, targetSize.height, options, encodingTargetBytes);
    throwIfAborted(options.signal);
    const { blob, mime: actualMime, width, height, quality, iterations } = encoded;
    if (
      options.keepOriginalIfLarger &&
      dimensionsInitiallyUnchanged &&
      sourceMime === actualMime &&
      blob.size >= file.size
    ) {
      reportProgress(options, 100);
      return { file };
    }

    const outputFile = new File([blob], replaceFileExtension(file.name, actualMime), {
      type: actualMime,
      lastModified: file.lastModified
    });
    const result: ICompressImgResult = {
      file: outputFile,
      beforeKB: Number(beforeKB.toFixed(2)),
      afterKB: Number((outputFile.size / 1024).toFixed(2)),
      width,
      height,
      mime: actualMime,
      compressed: true,
      quality,
      iterations,
      targetAchieved: options.targetFileSizeKB === undefined ? undefined : blob.size <= options.targetFileSizeKB * 1024
    };

    if (options.outputMode === 'legacy') {
      const [beforeSrc, afterSrc, arrayBuffer] = await Promise.all([
        readBlob(file, 'dataURL', options.signal),
        readBlob(blob, 'dataURL', options.signal),
        readBlob(blob, 'arrayBuffer', options.signal)
      ]);
      throwIfAborted(options.signal);
      result.origin = file;
      result.beforeSrc = beforeSrc;
      result.afterSrc = afterSrc;
      result.bufferArray = new Uint8Array(arrayBuffer);
    }
    reportProgress(options, 100);
    return result;
  } finally {
    decoded.release();
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  let failed = false;
  const execute = async () => {
    while (!failed && cursor < items.length) {
      const index = cursor++;
      try {
        results[index] = await worker(items[index], index);
      } catch (error) {
        failed = true;
        throw error;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, execute));
  return results;
}

/**
 * Web 端等比例压缩图片，支持单文件和 FileList。
 * 默认普通图片最大宽高为 2560px；长图会按方向放宽长边，但始终受 maxPixels 限制。
 * 批量处理默认最多并发两张；生产环境建议使用 outputMode: 'compact' 降低内存峰值。
 */
export function compressImg(file: File, options?: ICompressOptions): Promise<ICompressImgResult>;
export function compressImg(file: Blob, options?: ICompressOptions): Promise<ICompressImgResult>;
export function compressImg(file: FileList, options?: ICompressOptions): Promise<ICompressImgResult[]>;
export function compressImg(
  file: File | Blob | FileList,
  options: ICompressOptions = {}
): Promise<ICompressImgResult | ICompressImgResult[]> {
  const singleFile = isFile(file);
  const singleBlob = !singleFile && isBlob(file);
  const multipleFiles = isFileList(file);
  if (!singleFile && !singleBlob && !multipleFiles) {
    throw new TypeError(`${String(file)} require be File or FileList`);
  }

  const normalizedOptions = normalizeOptions(options);
  throwIfAborted(normalizedOptions.signal);
  if (singleFile || singleBlob) {
    const normalizedFile = singleFile ? file : blobToFile(file, normalizedOptions.fileName);
    const requiresCanvas = requiresCompression(normalizedFile, normalizedOptions);
    return compressOne(normalizedFile, normalizedOptions, !requiresCanvas || supportCanvas());
  }

  const files = Array.from(file as FileList);
  const requiresCanvas = files.some(item => requiresCompression(item, normalizedOptions));
  const canvasSupported = !requiresCanvas || supportCanvas();
  const progresses = new Array<number>(files.length).fill(0);
  return mapWithConcurrency(files, normalizedOptions.concurrency, (item, index) => {
    const itemOptions: NormalizedCompressOptions = normalizedOptions.onProgress
      ? {
          ...normalizedOptions,
          onProgress: progress => {
            progresses[index] = progress;
            reportProgress(normalizedOptions, progresses.reduce((sum, current) => sum + current, 0) / files.length);
          }
        }
      : normalizedOptions;
    return compressOne(item, itemOptions, canvasSupported);
  });
}

export default {
  IMAGE_COMPRESSION_PRESETS,
  supportCanvas,
  chooseLocalFile,
  compressImg
};
