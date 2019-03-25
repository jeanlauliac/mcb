import invariant from "./invariant";
import createArray from "./createArray";

/**
 * A double-ended queue with a static capacity and no dynamic allocations.
 * Can be used as a vector, a stack, etc.
 */
export default class Dequeue<Value> {
  private _data: Array<Value>;
  private _begin = 0;
  private _end = 0;

  constructor(capacity: number, valueCtor: () => Value) {
    invariant(
      capacity > 0 && Number.isInteger(capacity),
      "capacity must be a positive integer"
    );
    this._data = createArray(capacity, valueCtor);
  }

  clear() {
    this._begin = this._end = 0;
  }

  get size() {
    if (this._begin <= this._end) return this._end - this._begin;
    return this._data.length - this._begin + this._end;
  }

  isEmpty() {
    return this._begin === this._end;
  }

  isFull() {
    return this.size + 1 >= this._data.length;
  }

  push(): Value {
    if (this._end === this._data.length - 1) this._end = 0;
    else ++this._end;
    invariant(this._end !== this._begin, "Dequeue reached maximum capacity");
    return this.last;
  }

  get last(): Value {
    invariant(!this.isEmpty(), "Dequeue is empty");
    if (this._end === 0) return this._data[this._data.length - 1];
    return this._data[this._end - 1];
  }

  pop(): void {
    invariant(!this.isEmpty(), "Dequeue is already empty");
    if (this._end === 0) this._end = this._data.length - 1;
    else --this._end;
  }

  unshift(): Value {
    if (this._begin === 0) this._begin = this._data.length;
    --this._begin;
    invariant(this._end !== this._begin, "Dequeue reached maximum capacity");
    return this.first;
  }

  get first(): Value {
    invariant(!this.isEmpty(), "Dequeue is empty");
    return this._data[this._begin];
  }

  shift(): void {
    invariant(!this.isEmpty(), "Dequeue is already empty");
    ++this._begin;
    if (this._begin === this._data.length) this._begin = 0;
  }
}
