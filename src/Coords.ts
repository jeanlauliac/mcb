export default class Coords {
  row = 0;
  col = 0;

  projectFrom(source: Coords): void {
    this.row = Math.floor((source.row + 1) / 2) + source.col;
    this.col = -Math.floor(source.row / 2) + source.col;
  }

  unprojectFrom(source: Coords): void {
    this.row = source.row - source.col;
    this.col = Math.floor((source.row + source.col) / 2);
  }

  assign(from: Coords) {
    this.row = from.row;
    this.col = from.col;
  }

  equals(target: Coords): boolean {
    return this.row === target.row && this.col === target.col;
  }
}
