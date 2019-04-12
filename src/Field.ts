import Coords from "./Coords";
import ScreenCoords from "./ScreenCoords";
import createArray from "./createArray";

type Tile = { type: string };
const iter = new Coords();

export default class Field {
  _size = new ScreenCoords();
  _data: Array<Tile>;

  constructor(size: ScreenCoords) {
    this._size.assign(size);
    this._data = createArray(
      size.x * size.y,
      () => ({ type: "grass" } as Tile)
    );
  }

  get size(): Readonly<ScreenCoords> {
    return this._size;
  }

  getTileIndex(coords: Coords): number {
    return coords.row * this._size.x + coords.col;
  }

  getTile(index: number): Readonly<Tile> {
    return this._data[index];
  }

  setTileType(index: number, type: string): void {
    this._data[index].type = type;
  }

  areCoordsValid(coords: Coords, margin: number): boolean {
    return (
      coords.row >= 0 + margin &&
      coords.row < this._size.y - margin &&
      coords.col >= 0 + margin &&
      coords.col < this._size.x - margin
    );
  }

  fillRow(row: number, fromCol: number, toCol: number, type: string) {
    iter.row = row;
    for (iter.col = fromCol; iter.col <= toCol; ++iter.col) {
      this._data[this.getTileIndex(iter)].type = type;
    }
  }
}
