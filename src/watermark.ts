/*
 * @created: Saturday, 2020-04-18 14:38:23
 * @author: chendq
 * ---------
 * @desc 网页加水印的工具类
 */

import { isNullish, isString } from './type';

export interface ICanvasWM {
  rootContainer?: HTMLElement | string;
  width?: string;
  height?: string;
  textAlign?: CanvasTextAlign; //eslint-disable-line
  textBaseline?: CanvasTextBaseline; //eslint-disable-line
  font?: string;
  // fontWeight: number;
  fillStyle?: string;
  rotate?: number;
  zIndex?: number;
  watermarkId?: string;
}

/**
 * canvas 实现 水印, 具备防删除功能
 * @param {ICanvasWM} canvasWM
 * @example genCanvasWM({ content: 'QQMusicFE' })
 */
export function genCanvasWM(content = '请勿外传', canvasWM?: ICanvasWM): void {
  const {
    rootContainer = document.body,
    width = '300px',
    height = '150px',
    textAlign = 'center',
    textBaseline = 'middle',
    font = '20px PingFangSC-Medium,PingFang SC',
    // fontWeight = 500,
    fillStyle = 'rgba(189, 177, 167, .3)',

    rotate = -20,
    zIndex = 2147483647,
    watermarkId = '__wm'
  } = isNullish(canvasWM) ? {} : canvasWM;
  const container: HTMLElement | null = isString(rootContainer) ? document.querySelector(rootContainer) : rootContainer;
  if (!container) {
    throw new Error(`${rootContainer} is not valid Html Element or element selector`);
  }
  const canvas = document.createElement('canvas');
  canvas.setAttribute('width', width);
  canvas.setAttribute('height', height);
  const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');

  ctx!.textAlign = textAlign;
  ctx!.textBaseline = textBaseline;
  ctx!.font = font;
  // ctx!.fontWeight = fontWeight;
  ctx!.fillStyle = fillStyle;
  ctx!.rotate((Math.PI / 180) * rotate);
  ctx!.fillText(content, parseFloat(width) / 4, parseFloat(height) / 2);

  const base64Url = canvas.toDataURL();
  const __wm = document.querySelector(`#${watermarkId}`);
  const watermarkDiv = __wm || document.createElement('div');
  const styleStr = `opacity: 1 !important; display: block !important; visibility: visible !important;         position:absolute;          left:0; top:0;         width:100%;          height:100%;          z-index:${zIndex};          pointer-events:none;          background-repeat:repeat;          background-image:url('${base64Url}')`;
  watermarkDiv.setAttribute('style', styleStr);
  watermarkDiv.setAttribute('id', watermarkId);

  watermarkDiv.classList.add('nav-height');
  if (!__wm) {
    container.style.position = 'relative';
    container.appendChild(watermarkDiv);
  }
  const getMutableStyle = (ele: HTMLElement) => {
    const computedStyle = getComputedStyle(ele);
    return {
      opacity: computedStyle.getPropertyValue('opacity'),
      zIndex: computedStyle.getPropertyValue('z-index'),
      display: computedStyle.getPropertyValue('display'),
      visibility: computedStyle.getPropertyValue('visibility')
    };
  };
  //@ts-ignore
  const MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
  if (MutationObserver) {
    let mo: MutationObserver | null = new MutationObserver(function () {
      let __wm: HTMLElement | null = document.querySelector(`#${watermarkId}`); // 只在__wm元素变动才重新调用 __canvasWM
      if (!__wm) {
        // 避免一直触发
        // console.log('regenerate watermark by delete::')
        mo!.disconnect();
        mo = null;
        genCanvasWM(content, canvasWM);
      } else {
        const { opacity, zIndex, display, visibility } = getMutableStyle(__wm);
        if (
          (__wm && __wm.getAttribute('style') !== styleStr) ||
          !__wm ||
          !(opacity === '1' && zIndex === '2147483647' && display === 'block' && visibility === 'visible')
        ) {
          // 避免一直触发
          // console.log('regenerate watermark by inline style changed ::')
          mo!.disconnect();
          mo = null;
          container.removeChild(__wm);

          // @ts-ignore
          __wm = null;
          genCanvasWM(content, canvasWM);
        }
      }
    });
    mo.observe(container, { attributes: true, subtree: true, childList: true });
  }
}
