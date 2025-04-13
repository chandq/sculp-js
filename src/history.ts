import { objectMerge } from './object';
import { AnyFunc } from './type';

interface HistoryOptions {
  // 历史记录长度上限：默认 99
  maxLength: number;
}

export const defaults: HistoryOptions = {
  maxLength: 99
};

const _options = Symbol();
const _list = Symbol();
const _index = Symbol();

export default class History<T extends AnyFunc> {
  private [_options]: HistoryOptions;

  private [_list]: T[];

  private [_index]: number;

  constructor(options?: Partial<HistoryOptions>) {
    this[_options] = objectMerge<HistoryOptions>({}, defaults, options);
    this[_list] = [];
    this[_index] = -1;
  }

  get index(): number {
    return this[_index];
  }

  get length(): number {
    return this[_list].length;
  }

  get canUndo(): boolean {
    return this.index > 0 && this.length > 1;
  }

  get canRedo(): boolean {
    return this.index < this.length - 1 && this.length > 1;
  }

  /**
   * 获取某一个历史动作
   * @param {number} index
   * @returns {void | T}
   */
  get(index: number): T | void {
    return this[_list][index];
  }

  /**
   * 推入历史动作
   * @param {T} record
   * @returns {History<T>}
   */
  push(record: T): History<T> {
    this[_list].splice(this.index + 1);
    this[_list].push(record);
    if (this.length > this[_options].maxLength) this[_list].shift();
    this[_index] = this.length - 1;

    return this;
  }

  /**
   * 偏移移动
   * @param {number} offset
   * @returns {void | T}
   */
  move(offset: number): T | void {
    const to = this[_index] + offset;
    return this.goto(to);
  }

  /**
   * 前往指定记录点
   * @param {number} to
   * @returns {void | T}
   */
  goto(to: number): T | void {
    // 没有记录点
    if (this.length === 0) return;

    const record = this[_list][to];

    if (!record) return;

    this[_index] = to;
    return record;
  }

  /**
   * 前往开始记录点
   * @returns {void | T}
   */
  toStart() {
    return this.goto(0);
  }

  /**
   * 前往结束记录点
   * @returns {void | T}
   */
  toEnd() {
    return this.goto(this.length - 1);
  }

  /**
   * 撤销
   * @returns {void | T}
   */
  undo(): T | void {
    if (!this.canUndo) return;

    this[_index]--;
    return this[_list][this.index];
  }

  /**
   * 重做
   * @returns {void | T}
   */
  redo(): T | void {
    if (!this.canRedo) return;

    this[_index]++;
    return this[_list][this.index];
  }
}
