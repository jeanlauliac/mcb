import { TILE_HALF_WIDTH, TILE_HALF_HEIGHT } from "./constants";
import Coords from "./Coords";
import ScreenCoords from "./ScreenCoords";

export default function pickTile(
  pickedCoords: Coords,
  coords: ScreenCoords
): void {
  let gridRow = Math.floor(coords.y / TILE_HALF_HEIGHT);
  let gridCol = Math.floor(coords.x / TILE_HALF_WIDTH);
  let localX = coords.x % TILE_HALF_WIDTH;
  let localY = coords.y % TILE_HALF_HEIGHT;
  let row = 0;
  let col = 0;
  if ((gridRow + gridCol) % 2 === 0) {
    // Bottom-left to top-right split
    let relY = localY - TILE_HALF_HEIGHT;
    if (crossProduct(TILE_HALF_WIDTH, -TILE_HALF_HEIGHT, localX, relY) < 0) {
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
    if (crossProduct(TILE_HALF_WIDTH, TILE_HALF_HEIGHT, localX, localY) < 0) {
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
