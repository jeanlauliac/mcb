import {Coords} from './Coords';

type Tile = {type: string};

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
    type: 'grass',
  };
}

export function getTile(index: number): Readonly<Tile> {
  return data[index];
}

export function setTileType(index: number, type: string): void {
  data[index].type = type;
}

function fillRow(row: number, fromCol: number, toCol: number, type: string) {
  for (let col = fromCol; col <= toCol; ++col) {
    data[getTileIndex({row, col})].type = type;
  }
}

fillRow(8, 15, 16, 'water');
fillRow(9, 14, 17, 'water');
fillRow(10, 10, 18, 'water');
fillRow(11, 10, 18, 'water');
fillRow(12, 10, 18, 'water');
fillRow(13, 10, 17, 'water');
fillRow(14, 10, 16, 'water');
fillRow(15, 9, 15, 'water');
fillRow(16, 9, 15, 'water');
fillRow(17, 9, 15, 'water');
fillRow(18, 9, 16, 'water');
fillRow(19, 10, 16, 'water');
fillRow(20, 10, 15, 'water');
fillRow(21, 10, 13, 'water');
fillRow(22, 12, 12, 'water');
