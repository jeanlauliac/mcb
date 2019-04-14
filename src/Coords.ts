import WorldCoords from "./WorldCoords";

export default class Coords {
  row: number;
  col: number;

  constructor(row = 0, col = 0)  {
    this.row = row;
    this.col = col;
  }

  unprojectFrom(source: WorldCoords): void {
    this.row = source.row - source.col;
    this.col = Math.floor((source.row + source.col) / 2);
  }

  assign(from: Coords) {
    this.row = from.row;
    this.col = from.col;
  }

  set(row: number, col: number) {
    this.row = row;
    this.col = col;
  }

  equals(target: Coords): boolean {
    return this.row === target.row && this.col === target.col;
  }
}
