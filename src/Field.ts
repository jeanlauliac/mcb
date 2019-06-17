import Coords from "./Coords";
import ScreenCoords from "./ScreenCoords";
import createArray from "./createArray";
import PRNG from "./PRNG";

type Tile = { type: string; entityID: number };
const iter = new Coords();
const rng = new PRNG(0);

export class Entity {
  type: string = 'invalid';
  coords: Coords = new Coords();
};

export type EntitySlot = {inUse: boolean, entity: Entity};

export default class Field {
  _size = new ScreenCoords();
  _data: Array<Tile>;
  _entities: Array<EntitySlot>;
  _nextEntityID: number;

  constructor(size: ScreenCoords) {
    this._size.assign(size);
    this._data = createArray<Tile>(
      size.x * size.y,
      () => ({
        type: ["grass_1", "grass_2", "grass_3"][rng.nextInt(3)],
        entityID: 0,
      })
    );
    this._entities = createArray<EntitySlot>(
      256,
      () => ({inUse: false, entity: new Entity()}),
    );
    this._nextEntityID = 0;
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

  getEntity(id: number): Entity {
    const slot = this._entities[id];
    if (!slot.inUse) throw new Error('non existent entity ID');
    return slot.entity;
  }

  setTileType(index: number, type: string, entityID: number = 0): void {
    this._data[index].type = type;
    this._data[index].entityID = entityID;
  }

  createEntity(): number {
    let maxSearch = 256;
    while (this._entities[this._nextEntityID].inUse && maxSearch > 0) {
      this._nextEntityID = (this._nextEntityID + 1) % this._entities.length;
      --maxSearch;
    }
    if (maxSearch === 0) {
      throw new Error('no more entity slots');
    }
    this._entities[this._nextEntityID].inUse = true;
    return this._nextEntityID;
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
      this._data[this.getTileIndex(iter)].type =
        ["water_1", "water_2"][rng.nextInt(2)];
    }
  }

  setRow(row: number, fromCol: number, types: Array<string>) {
    iter.row = row;
    let i = 0;
    for (iter.col = fromCol; i < types.length; ++iter.col, ++i) {
      this._data[this.getTileIndex(iter)].type = types[i];
    }
  }
}
