import * as Field from './Field';
import invariant from './invariant';

export type Neighbours = Array<{row: number, col: number}>;

export default function findNeighbours(result: Neighbours, row: number, col: number): void {
  invariant(result.length === 4);
  if (row % 2 === 0) {
    setNeighbour(result, 0, row - 1, col);
    setNeighbour(result, 1, row + 1, col);
    setNeighbour(result, 2, row + 1, col - 1);
    setNeighbour(result, 3, row - 1, col - 1);
  } else {
    setNeighbour(result, 0, row - 1, col + 1);
    setNeighbour(result, 1, row + 1, col + 1);
    setNeighbour(result, 2, row + 1, col);
    setNeighbour(result, 3, row - 1, col);
  }
}

function setNeighbour(result: Neighbours, slot: number, row: number, col: number): void {
  result[slot].row = row;
  result[slot].col = col;
}
