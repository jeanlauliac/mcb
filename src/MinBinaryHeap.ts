import invariant from "./invariant";
import createArray from "./createArray";

/*

A binary heap with min-key property and with no dynamic allocations. That can be
used as a priority queue.

*/
export default class MinBinaryHeap<Value> {
  private _data: Array<[number, Value]>;
  private _size: number;

  constructor(maxSize: number, valueCtor: () => Value) {
    this._size = 0;
    this._data = createArray<[number, Value]>(maxSize, () => [0, valueCtor()]);
  }

  clear() {
    this._size = 0;
  }

  get size() {
    return this._size;
  }

  isEmpty() {
    return this._size === 0;
  }

  /**
   * Push the specified key into the heap and returns the corresponding value,
   * which can be mutated accordingly. The value is returned rather than
   * passed as argument so that we don't need to do any copy.
   */
  push(key: number): Value {
    invariant(this._size < this._data.length);
    let i = this._size;
    this._data[i][0] = key;
    while (i !== 0 && this._data[i][0] < this._data[(i / 2) | 0][0]) {
      const pi = (i / 2) | 0;
      this._swap(i, pi);
      i = pi;
    }
    ++this._size;
    return this._data[i][1];
  }

  /**
   * Look up the value which key is the smallest of the heap.
   */
  peek(): Value {
    invariant(this._size > 0);
    return this._data[0][1];
  }

  /**
   * Remove the value which key is the smallest of the heap.
   */
  pop(): void {
    invariant(this._size > 0);
    this._swap(0, this._size - 1);
    --this._size;
    let i = 0;
    while (true) {
      const li = i * 2;
      const ri = li + 1;
      let smallest = i;
      if (li < this._size && this._data[li][0] < this._data[smallest][0]) {
        smallest = li;
      }
      if (ri < this._size && this._data[ri][0] < this._data[smallest][0]) {
        smallest = ri;
      }
      if (smallest === i) break;
      this._swap(i, smallest);
      i = smallest;
    }
  }

  private _swap(i: number, j: number) {
    const v = this._data[i];
    this._data[i] = this._data[j];
    this._data[j] = v;
  }
}
