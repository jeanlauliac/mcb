import Coords from './Coords';
import Dequeue from './Dequeue';
import Map from './Map';
import hashInteger from './hashInteger';
import createArray from './createArray';
import { LocalMouseEvent } from './MouseEvents';
import pickTile from './pickTile';
import ScreenCoords from './ScreenCoords';
import findNeighbours from './findNeighbours';
import findShortestPath from './findShortestPath';
import * as Field from './Field';

const pickedTile = new Coords();
const path = new Dequeue(512, () => new Coords());
const neighbours = createArray(4, () => new Coords());
const neighbourSt = createArray(4, () => false);

export default class RoadBuilder {
  _isBuilding = false;
  _currentCoords = new Coords();
  _originCoords = new Coords();
  _tiles: Dequeue<{ coords: Coords; type: string }> = new Dequeue(512, () => ({ coords: new Coords(), type: "" }));
  _tileMap: Map<number, { type: string }> = new Map(512, () => ({ type: "" }), hashInteger);

  enable(ev: LocalMouseEvent, camera: ScreenCoords) {
    this._isBuilding = false;
    this.handleMouseEvent(ev, camera);
  }

  handleMouseEvent(ev: LocalMouseEvent, camera: ScreenCoords): void {
    pickTile(pickedTile, ev.clientX + camera.x, ev.clientY + camera.y);
    if (!this._isBuilding) {
      this._handleMouseEventInStandby(ev, pickedTile);
      return;
    }
    if (!this._currentCoords.equals(pickedTile)) {
      this._updateCurrentCoords(pickedTile);
    }
    if ((ev.buttons & 1) !== 0) return;
    this._isBuilding = false;
    for (const tile of this._tiles) {
      Field.setTileType(Field.getTileIndex(tile.coords), tile.type);
    }
  }

  _handleMouseEventInStandby(ev: LocalMouseEvent, picked: Coords) {
    if ((ev.buttons & 1) === 0) {
      this._currentCoords.assign(picked);
      return;
    }
    this._isBuilding = true;
    this._originCoords.assign(picked);
    this._updateCurrentCoords(picked);
  }

  _updateCurrentCoords(target: Coords) {
    this._currentCoords.assign(target);
    findShortestPath(path, this._originCoords, this._currentCoords);

    this._tiles.clear();
    this._tileMap.clear();

    let prevIndex = -1;
    while (!path.isEmpty()) {
      const coords = path.first;
      const roadTile = this._tiles.push();
      roadTile.coords.assign(coords);
      path.shift();

      const index = Field.getTileIndex(coords);
      findNeighbours(neighbours, coords);
      for (let i = 0; i < 4; ++i) {
        const ni = Field.getTileIndex(neighbours[i]);
        const nextIndex = path.isEmpty() ? -1 : Field.getTileIndex(path.first);
        neighbourSt[i] = ni === prevIndex || ni === nextIndex;
      }

      const tile = Field.getTile(index);
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
  0b0101: "road_v",
  0b1010: "road_h",
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
