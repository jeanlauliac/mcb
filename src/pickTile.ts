import Coords from "./Coords";
import ScreenCoords from "./ScreenCoords";

export default function pickTile(
  tileHalfSize: ScreenCoords,
  pickedCoords: Coords,
  coords: ScreenCoords
): void {
  let gridRow = Math.floor(coords.y / tileHalfSize.y);
  let gridCol = Math.floor(coords.x / tileHalfSize.x);
  let localX = coords.x % tileHalfSize.x;
  let localY = coords.y % tileHalfSize.y;
  let row = 0;
  let col = 0;
  if ((gridRow + gridCol) % 2 === 0) {
    // Bottom-left to top-right split
    let relY = localY - tileHalfSize.y;
    if (crossProduct(tileHalfSize.x, -tileHalfSize.y, localX, relY) < 0) {
      // top-left corner
      row = gridRow;
      if (gridRow % 2 === 0) {
        col = gridCol / 2;
      } else {
        col = (gridCol - 1) / 2;
      }
    } else {
      // bottom-right corner
      row = gridRow + 1;
      if (gridRow % 2 === 0) {
        col = gridCol / 2;
      } else {
        col = (gridCol - 1) / 2 + 1;
      }
    }
  } else {
    if (crossProduct(tileHalfSize.x, tileHalfSize.y, localX, localY) < 0) {
      // top-right corner
      row = gridRow;
      if (gridRow % 2 === 0) {
        col = (gridCol - 1) / 2 + 1;
      } else {
        col = gridCol / 2;
      }
    } else {
      row = gridRow + 1;
      if (gridRow % 2 === 0) {
        col = (gridCol - 1) / 2;
      } else {
        col = gridCol / 2;
      }
    }
  }

  pickedCoords.set(row, col);
}

function crossProduct(aX: number, aY: number, bX: number, bY: number) {
  return aX * bY - aY * bX;
}
