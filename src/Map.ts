import invariant from './invariant';
import createArray from './createArray';

type Bucket<Key, Value> = {
  seqNumber: number,
  key?: Key,
  value: Value,
}

/**
 * Implement a Map with no dynamic allocations using linear open addressing
 * (https://en.wikipedia.org/wiki/Open_addressing).
 */
export default class Map<Key, Value> {
  private _data: Array<Bucket<Key, Value>>;
  private _seqNumber: number = 1;
  private _keyHash: (key: Key) => number;

  constructor(capacity: number,
      valueCtor: () => Value, keyHash: (key: Key) => number) {
    invariant(
      capacity > 0 &&
        Number.isInteger(capacity),
      'capacity must be a positive integer',
    );
    this._data = createArray(capacity, () => {
      return {seqNumber: 0, key: null, value: valueCtor()};
    });
    this._keyHash = keyHash;
  }

  clear() {
    ++this._seqNumber;
  }

  set(key: Key): Value {
    const slot = this._data[this._findSlot(key)];
    invariant(slot.key === key || slot.seqNumber < this._seqNumber,
        'map storage is full');
    slot.seqNumber = this._seqNumber;
    slot.key = key;
    return slot.value;
  }

  get(key: Key): Value | null {
    const slot = this._data[this._findSlot(key)];
    if (slot.key === key && slot.seqNumber === this._seqNumber)
      return slot.value;
    return null;
  }

  delete(key: Key): boolean {
    let i = this._findSlot(key);
    if (this._data[i].key !== key) return false;
    this._data[i].seqNumber = 0;
    let j = i;
    const size = this._data.length;
    while (true) {
      j = (j + 1) % size;
      if (this._data[j].seqNumber < this._seqNumber) {
        break;
      }
      const k = this._keyHash(this._data[j].key) % size;
      if ((i<=j) ? ((i<k)&&(k<=j)) : ((i<k)||(k<=j)))
        continue;
      this._swapSlots(i, j);
      i = j;
    };
    return true;
  }

  _findSlot(key: Key): number {
    const size = this._data.length;
    let i = this._keyHash(key) % size;
    let j = 0;
    let slot = this._data[i];
    while (j < size && slot.key !== key &&
        slot.seqNumber === this._seqNumber) {
      i = (i + 1) % size;
      ++j;
      slot = this._data[i];
    }
    return i;
  }

  _swapSlots(i: number, j: number): void {
    const slot = this._data[i];
    this._data[i] = this._data[j];
    this._data[j] = slot;
  }
}
