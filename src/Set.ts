import Map from "./Map";

export default class Set<Key> {
  private _store: Map<Key, true>;

  constructor(capacity: number, keyHash: (key: Key) => number) {
    this._store = new Map<Key, true>(capacity, () => true, keyHash);
  }

  clear() {
    this._store.clear();
  }

  get size() {
    return this._store.size;
  }

  isEmpty() {
    return this._store.isEmpty();
  }

  isFull() {
    return this._store.isFull();
  }

  add(key: Key): void {
    this._store.set(key);
  }

  has(key: Key): boolean {
    return this._store.get(key) != null;
  }

  delete(key: Key): boolean {
    return this._store.delete(key);
  }
}
