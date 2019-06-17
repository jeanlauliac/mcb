import Coords from "./Coords";
import WorldCoords from "./WorldCoords";
import ScreenCoords from "./ScreenCoords";
import pickTile from "./pickTile";
import { MouseEventType } from "./MouseEvents";
import Field from "./Field";
import { ROAD_TYPE_REVERSE_TABLE, ROAD_TYPE_TABLE } from "./RoadBuilder";

const pickedTile = new Coords();
const unproj = new Coords();
const piter = new WorldCoords();

export default class Bulldozer {
  _isDeleting = false;
  _fromCoords = new Coords();
  _toCoords = new Coords();
  _square = { projFrom: new WorldCoords(), projTo: new WorldCoords() };
  _field: Field;

  constructor(field: Field) {
    this._field = field;
  }

  enable(fieldCoords: ScreenCoords): void {
    this._isDeleting = false;
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

  _handleMouseClickDown() {
    this._isDeleting = true;
    this._fromCoords.assign(this._toCoords);
    this._updateCurrentCoords(this._toCoords);
    return;
  }

  _handleMouseClickUp() {
    if (!this._isDeleting) return;
    this._isDeleting = false;
    const sq = this._square;
    for (piter.row = sq.projFrom.row; piter.row <= sq.projTo.row; ++piter.row) {
      for (
        piter.col = sq.projFrom.col;
        piter.col <= sq.projTo.col;
        ++piter.col
      ) {
        unproj.unprojectFrom(piter);
        if (!this._field.areCoordsValid(unproj, 1)) {
          continue;
        }
        const ix = this._field.getTileIndex(unproj);
        const tile = this._field.getTile(ix);
        if (ROAD_TYPE_REVERSE_TABLE[tile.type] != null) {
          this._field.setTileType(ix, "grass_1");
        }
      }
    }

    piter.row = sq.projFrom.row - 1;
    for (piter.col = sq.projFrom.col; piter.col <= sq.projTo.col; ++piter.col) {
      this._cleanupDeletedRoadEdge(piter, 0b1011);
    }

    piter.row = sq.projTo.row + 1;
    for (piter.col = sq.projFrom.col; piter.col <= sq.projTo.col; ++piter.col) {
      this._cleanupDeletedRoadEdge(piter, 0b1110);
    }

    piter.col = sq.projFrom.col - 1;
    for (piter.row = sq.projFrom.row; piter.row <= sq.projTo.row; ++piter.row) {
      this._cleanupDeletedRoadEdge(piter, 0b0111);
    }

    piter.col = sq.projTo.col + 1;
    for (piter.row = sq.projFrom.row; piter.row <= sq.projTo.row; ++piter.row) {
      this._cleanupDeletedRoadEdge(piter, 0b1101);
    }
  }

  _cleanupDeletedRoadEdge(coords: WorldCoords, maskFilter: number): void {
    unproj.unprojectFrom(coords);
    if (!this._field.areCoordsValid(unproj, 1)) {
      return;
    }
    const ix = this._field.getTileIndex(unproj);
    const tile = this._field.getTile(ix);

    let mask = ROAD_TYPE_REVERSE_TABLE[tile.type];
    if (mask == null) return;
    mask &= maskFilter;
    this._field.setTileType(ix, ROAD_TYPE_TABLE[mask] || "grass_1");
  }

  _handleMouseMove(fieldCoords: ScreenCoords) {
    pickTile(pickedTile, fieldCoords);
    if (!this._isDeleting) {
      this._toCoords.assign(pickedTile);
      return;
    }
    if (!this._toCoords.equals(pickedTile)) {
      this._updateCurrentCoords(pickedTile);
    }
  }

  _updateCurrentCoords(target: Coords) {
    this._toCoords.assign(target);
    projectSquare(this._square, this._fromCoords, this._toCoords);
  }

  get square() {
    return this._isDeleting ? this._square : null;
  }

  get currentCoords() {
    return this._toCoords;
  }
}

type Square = { projFrom: WorldCoords; projTo: WorldCoords };

function projectSquare(res: Square, from: Coords, to: Coords): void {
  res.projFrom.projectFrom(from);
  res.projTo.projectFrom(to);
  if (res.projFrom.row > res.projTo.row) {
    const row = res.projTo.row;
    res.projTo.row = res.projFrom.row;
    res.projFrom.row = row;
  }
  if (res.projFrom.col > res.projTo.col) {
    const col = res.projTo.col;
    res.projTo.col = res.projFrom.col;
    res.projFrom.col = col;
  }
}
