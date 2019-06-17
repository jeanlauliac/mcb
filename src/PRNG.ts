export default class PRNG {
  _seed: number;

  constructor(seed: number) {
    this._seed = seed % 2147483647;
    if (this._seed <= 0) this._seed += 2147483646;
  }

  /**
   * Returns a pseudo-random value between 1 and 2^32 - 2.
   */
  next(): number {
    return (this._seed = (this._seed * 16807) % 2147483647);
  }

  nextInt(upperLimit: number): number {
    return Math.floor((this.next() / 2147483646) * upperLimit);
  }
}
