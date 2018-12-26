import * as Field from './Field';
import invariant from './invariant';

export type Neighbours = {
  data: Array<{row: number, col: number}>,
  count: number,
};

export default function findNeighbours(result: Neighbours, row: number, col: number): void {
  invariant(result.data.length >= 4);
  result.count = 0;
  if (row % 2 === 0) {
    addNeighbour(result, row - 1, col);
    addNeighbour(result, row + 1, col);
    addNeighbour(result, row + 1, col - 1);
    addNeighbour(result, row - 1, col - 1);
  } else {
    addNeighbour(result, row - 1, col + 1);
    addNeighbour(result, row + 1, col + 1);
    addNeighbour(result, row + 1, col);
    addNeighbour(result, row - 1, col);
  }
}

function addNeighbour(result: Neighbours, row: number, col: number): void {
  if (row < 0 || row >= Field.height || col < 0 || col >= Field.width) {
    return;
  }
  result.data[result.count].row = row;
  result.data[result.count].col = col;
  ++result.count;
}
