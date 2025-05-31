/**
 * @title tooltip
 * @Desc 自定义的tooltip方法, 支持拖动悬浮提示
 * Created by chendeqiao on 2017/5/8.
 * @example
 *  <span onmouseleave="handleMouseLeave('#root')" onmousemove="handleMouseEnter({rootContainer: '#root', title: 'title content', event: event})"
 * 		onmouseenter="handleMouseEnter({rootContainer:'#root', title: 'title content', event: event})">title content </span>
 */

import { getStrWidthPx } from './dom';
import { isString } from './type';

interface ITooltipParams {
  rootContainer: HTMLElement | string;
  title: string;
  event: PointerEvent | MouseEvent;
  bgColor?: string;
  color?: string;
}

/**
 * 自定义title提示功能的mouseenter事件句柄
 * @param {ITooltipParams} param1
 * @returns {*}
 */
function handleMouseEnter({
  rootContainer = '#root',
  title,
  event,
  bgColor = '#000',
  color = '#fff'
}: ITooltipParams): void {
  try {
    const $rootEl = isString(rootContainer) ? document.querySelector(rootContainer) : rootContainer;
    console.assert($rootEl !== null, `未找到id为 ${rootContainer} 的dom元素`);
    let $customTitle: HTMLDivElement | null = null;
    const styleId = 'style-tooltip-inner1494304949567';
    // 动态创建class样式，并加入到head中
    if (!document.querySelector(`#${styleId}`)) {
      const tooltipWrapperClass = document.createElement('style');
      tooltipWrapperClass.type = 'text/css';
      tooltipWrapperClass.id = styleId;
      tooltipWrapperClass.innerHTML = `
        .tooltip-inner1494304949567 {
          max-width: 250px;
          padding: 3px 8px;
          color: ${color};
          text-decoration: none;
          border-radius: 4px;
          text-align: left;
          background-color: ${bgColor};
        }
      `;
      document.querySelector('head')!.appendChild(tooltipWrapperClass);
    }
    $customTitle = document.querySelector('#customTitle1494304949567');
    if ($customTitle) {
      mouseenter($customTitle!, title, event);
    } else {
      const $contentContainer = document.createElement('div');
      $contentContainer.id = 'customTitle1494304949567';
      $contentContainer.style.cssText = 'z-index: 99999999; visibility: hidden; position: absolute;';
      $contentContainer.innerHTML =
        '<div class="tooltip-inner1494304949567" style="word-wrap: break-word; max-width: 44px;">皮肤</div>';
      $rootEl!.appendChild($contentContainer);
      $customTitle = document.querySelector('#customTitle1494304949567');
      if (title) {
        //判断div显示的内容是否为空
        mouseenter($customTitle!, title, event);
        $customTitle!.style.visibility = 'visible';
      }
    }
  } catch (e: any) {
    console.error(e.message);
  }
}
/**
 * 提示文案dom渲染的处理函数
 * @param {HTMLDivElement} customTitle
 * @param {string} title 提示的字符串
 * @param {PointerEvent} e 事件对象
 * @returns {*}
 */
function mouseenter($customTitle: HTMLDivElement, title: string, e: PointerEvent | MouseEvent) {
  let diffValueX = 200 + 50; //默认设置弹出div的宽度为250px
  let x = 13;
  const y = 23;
  const $contentEle: any = $customTitle.children[0];
  if (getStrWidthPx(title, 12) < 180 + 50) {
    //【弹出div自适应字符串宽度】若显示的字符串占用宽度小于180，则设置弹出div的宽度为“符串占用宽度”+20
    $contentEle.style.maxWidth = getStrWidthPx(title, 12) + 20 + 50 + 'px';
    diffValueX = e.clientX + (getStrWidthPx(title, 12) + 50) - document.body.offsetWidth;
  } else {
    $contentEle.style.maxWidth = '250px';
    diffValueX = e.clientX + 230 - document.body.offsetWidth; //计算div水平方向显示的内容超出屏幕多少宽度
  }

  $contentEle.innerHTML = title; //html方法可解析内容中换行标签，text方法不能
  if (diffValueX > 0) {
    //水平方向超出可见区域时
    x -= diffValueX;
  }
  $customTitle.style.top = e.clientY + y + 'px';
  $customTitle.style.left = e.clientX + x + 'px';
  $customTitle.style.maxWidth = '250px';
  const diffValueY = $customTitle.getBoundingClientRect().top + $contentEle.offsetHeight - document.body.offsetHeight;
  if (diffValueY > 0) {
    //垂直方向超出可见区域时
    $customTitle.style.top = e.clientY - diffValueY + 'px';
  }
}
/**
 * 移除提示文案dom的事件句柄
 * @param {string} rootContainer
 * @returns {*}
 */
function handleMouseLeave(rootContainer: HTMLElement | string = '#root'): void {
  const rootEl = isString(rootContainer) ? document.querySelector(rootContainer) : rootContainer,
    titleEl = document.querySelector('#customTitle1494304949567');
  if (rootEl && titleEl) {
    rootEl.removeChild(titleEl);
  }
}
const tooltipEvent = { handleMouseEnter, handleMouseLeave };
export { tooltipEvent };
