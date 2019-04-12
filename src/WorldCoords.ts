import Coords from "./Coords";

export default class WorldCoords {
  row = 0;
  col = 0;

  projectFrom(source: Coords): void {
    this.row = Math.floor((source.row + 1) / 2) + source.col;
    this.col = -Math.floor(source.row / 2) + source.col;
  }

  assign(from: WorldCoords): this {
    this.row = from.row;
    this.col = from.col;
    return this;
  }

  set(row: number, col: number): this {
    this.row = row;
    this.col = col;
    return this;
  }

  equals(target: WorldCoords): boolean {
    return this.row === target.row && this.col === target.col;
  }
}
