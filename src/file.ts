/**
 * 选择本地文件
 * @param {string} accept 上传的文件类型，用于过滤
 * @param {Function} changeCb 选择文件回调
 * @returns {HTMLInputElement}
 */
export function chooseLocalFile(accept: string, changeCb: (FileList) => any) {
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
