/**
 * 选择本地文件
 * @param {function} changeCb 选择文件回调
 * @return {*}
 */
export function chooseLocalFile({ accept }, changeCb: (FileList) => any) {
  const inputObj: HTMLInputElement = document.createElement('input')
  inputObj.setAttribute('id', String(Date.now()))
  inputObj.setAttribute('type', 'file')
  inputObj.setAttribute('style', 'visibility:hidden')
  inputObj.setAttribute('accept', accept)
  document.body.appendChild(inputObj)
  inputObj.click()
  // @ts-ignore
  inputObj.onchange = (e: PointerEvent): any => {
    changeCb((<HTMLInputElement>e.target).files)

    setTimeout(() => document.body.removeChild(inputObj));
  }
  return inputObj
}