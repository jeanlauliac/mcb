import Coords from "./Coords";
import Dequeue from "./Dequeue";
import Map from "./Map";
import hashInteger from "./hashInteger";
import createArray from "./createArray";
import { LocalMouseEvent, MouseEventType } from "./MouseEvents";
import pickTile from "./pickTile";
import ScreenCoords from "./ScreenCoords";
import findNeighbours from "./findNeighbours";
import findShortestPath from "./findShortestPath";
import Field from "./Field";

const pickedTile = new Coords();
const path = new Dequeue(512, () => new Coords());
const neighbours = createArray(4, () => new Coords());
const neighbourSt = createArray(4, () => false);
const fieldCoords = new ScreenCoords();

export default class RoadBuilder {
  _isBuilding = false;
  _currentCoords = new Coords();
  _originCoords = new Coords();
  _tiles: Dequeue<{ coords: Coords; type: string }> = new Dequeue(512, () => ({
    coords: new Coords(),
    type: ""
  }));
  _tileMap: Map<number, { type: string }> = new Map(
    512,
    () => ({ type: "" }),
    hashInteger
  );
  _field: Field;

  constructor(field: Field) {
    this._field = field;
  }

  enable(fieldCoords: ScreenCoords) {
    this._isBuilding = false;
    this._handleMouseMove(fieldCoords);
  }

  handleMouseEvent(type: MouseEventType, fieldCoords: ScreenCoords): void {
    switch (type) {
      case MouseEventType.Move:
        return this._handleMouseMove(fieldCoords);
      case MouseEventType.Up:
        return this._handleMouseClickUp();
      case MouseEventType.Down:
        return this._handleMouseClickDown();
    }
  }

  _handleMouseClickDown(): void {
    this._isBuilding = true;
    this._originCoords.assign(this._currentCoords);
    this._updateCurrentCoords(this._currentCoords);
  }

  _handleMouseClickUp(): void {
    if (!this._isBuilding) return;
    this._isBuilding = false;
    for (const tile of this._tiles) {
      this._field.setTileType(this._field.getTileIndex(tile.coords), tile.type);
    }
  }

  _handleMouseMove(fieldCoords: ScreenCoords) {
    pickTile(pickedTile, fieldCoords);
    if (!this._isBuilding) {
      this._currentCoords.assign(pickedTile);
      return;
    }
    if (!this._currentCoords.equals(pickedTile)) {
      this._updateCurrentCoords(pickedTile);
    }
  }

  _updateCurrentCoords(target: Coords) {
    this._currentCoords.assign(target);
    findShortestPath(
      path,
      this._field,
      this._originCoords,
      this._currentCoords
    );

    this._tiles.clear();
    this._tileMap.clear();

    let prevIndex = -1;
    while (!path.isEmpty()) {
      const coords = path.first;
      const roadTile = this._tiles.push();
      roadTile.coords.assign(coords);
      path.shift();

      const index = this._field.getTileIndex(coords);
      findNeighbours(neighbours, coords);
      for (let i = 0; i < 4; ++i) {
        const ni = this._field.getTileIndex(neighbours[i]);
        const nextIndex = path.isEmpty()
          ? -1
          : this._field.getTileIndex(path.first);
        neighbourSt[i] = ni === prevIndex || ni === nextIndex;
      }

      const tile = this._field.getTile(index);
      roadTile.type = identifyRoadType(neighbourSt, tile.type);
      this._tileMap.set(index).type = roadTile.type;
      prevIndex = index;
    }
  }

  get tileMap() {
    if (!this._isBuilding) return null;
    return this._tileMap;
  }

  get currentCoords() {
    return this._currentCoords;
  }
}

export const ROAD_TYPE_TABLE: { [key: number]: string } = {
  0b0011: "road_turn_left",
  0b1100: "road_turn_right",
  0b1001: "road_turn_top",
  0b0110: "road_turn_bottom",
  0b0101: "path_straight_top_left",
  0b1010: "path_straight_top_right",
  0b0001: "road_end_tl",
  0b1000: "road_end_tr",
  0b0010: "road_end_bl",
  0b0100: "road_end_br",
  0b1011: "road_tee_tl",
  0b1101: "road_tee_tr",
  0b0111: "road_tee_bl",
  0b1110: "road_tee_br",
  0b1111: "road_cross"
};

export const ROAD_TYPE_REVERSE_TABLE = (() => {
  const result: { [key: string]: number } = {};
  for (const key in ROAD_TYPE_TABLE) {
    result[ROAD_TYPE_TABLE[key]] = Number(key);
  }
  return result;
})();

function identifyRoadType(ns: Array<boolean>, currentType: string) {
  const currentMask = ROAD_TYPE_REVERSE_TABLE[currentType] || 0;
  const newMask =
    (Number(ns[0]) << 3) |
    (Number(ns[1]) << 2) |
    (Number(ns[2]) << 1) |
    Number(ns[3]);
  return ROAD_TYPE_TABLE[currentMask | newMask] || "grass";
}
