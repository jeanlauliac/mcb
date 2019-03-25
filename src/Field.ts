import Coords from "./Coords";

type Tile = { type: string };

export const width = 40;
export const height = 60;

const data = (() => {
  let result = Array(height * width);
  for (let i = 0; i < result.length; ++i) {
    result[i] = createTile();
  }
  return result;
})();

export function getTileIndex(coords: Coords) {
  return coords.row * width + coords.col;
}

export function createTile() {
  return {
    type: "grass"
  };
}

export function getTile(index: number): Readonly<Tile> {
  return data[index];
}

export function setTileType(index: number, type: string): void {
  data[index].type = type;
}

const iter = new Coords();
function fillRow(row: number, fromCol: number, toCol: number, type: string) {
  iter.row = row;
  for (iter.col = fromCol; iter.col <= toCol; ++iter.col) {
    data[getTileIndex(iter)].type = type;
  }
}

fillRow(8, 15, 16, "water");
fillRow(9, 14, 17, "water");
fillRow(10, 10, 18, "water");
fillRow(11, 10, 18, "water");
fillRow(12, 10, 18, "water");
fillRow(13, 10, 17, "water");
fillRow(14, 10, 16, "water");
fillRow(15, 9, 15, "water");
fillRow(16, 9, 15, "water");
fillRow(17, 9, 15, "water");
fillRow(18, 9, 16, "water");
fillRow(19, 10, 16, "water");
fillRow(20, 10, 15, "water");
fillRow(21, 10, 13, "water");
fillRow(22, 12, 12, "water");

fillRow(26, 4, 7, "water");
fillRow(27, 4, 7, "water");
fillRow(28, 5, 8, "water");
fillRow(29, 5, 10, "water");
fillRow(30, 8, 25, "water");
fillRow(31, 8, 24, "water");
fillRow(32, 9, 24, "water");
fillRow(33, 9, 24, "water");
fillRow(33, 10, 24, "water");
fillRow(34, 10, 24, "water");
fillRow(35, 15, 24, "water");
fillRow(36, 15, 24, "water");
fillRow(37, 15, 24, "water");
