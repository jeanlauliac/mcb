import * as Field from './Field';
import findNeighbours, {Neighbours} from './findNeighbours';
import {Coords, createCoords, copyCoords, project} from './Coords';
import MinBinaryHeap from './MinBinaryHeap';

const {getTileIndex} = Field;

const neighbours: Neighbours = [];
for (let i = 0; i < 4; ++i) {
  neighbours.push({row: 0, col: 0});
}

const pending: MinBinaryHeap<Coords> = new MinBinaryHeap(512, createCoords);
const projNeighbour: Coords = createCoords();
const projTo: Coords = createCoords();

export default function findShortestPath(
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
) {
  let found = false;
  const cameFrom: {[key: number]: {row: number, col: number}} = {};
  pending.clear();
  const pendingIds: {[key: number]: true} = {};
  let current = {row: fromRow, col: fromCol};
  if (Field.data[getTileIndex(current)].type === 'water') {
    return [];
  }
  copyCoords(pending.push(0), current);
  pendingIds[getTileIndex(current)] = true;

  const scores: {[key: number]: number} = {};
  scores[getTileIndex(current)] = 0;

  project(projTo, {row: toRow, col: toCol});

  while (!pending.isEmpty()) {
    copyCoords(current, pending.peek());
    pending.pop();
    if (current.row === toRow && current.col === toCol) {
      found = true;
      break;
    }
    const curTileIx = getTileIndex(current);
    delete pendingIds[curTileIx];

    findNeighbours(neighbours, current.row, current.col);
    for (let i = 0; i < neighbours.length; ++i) {
      const neighbour = neighbours[i];
      if (neighbour.row < 0 || neighbour.row >= Field.height || neighbour.col < 0 || neighbour.col >= Field.width) {
        continue;
      }
      const neighbourIx = getTileIndex(neighbour);
      if (Field.data[neighbourIx].type === 'water') {
        continue;
      }
      const {row, col} = neighbour;
      const score = scores[curTileIx] + 1;

      if (scores[neighbourIx] != null && score >= scores[neighbourIx]) continue;
      if (!pendingIds[neighbourIx]) {
        project(projNeighbour, neighbour);
        const distToEnd = Math.abs(projTo.row - projNeighbour.row)
          + Math.abs(projTo.col - projNeighbour.col) * 2;
        const fscore = score + distToEnd;
        copyCoords(pending.push(fscore), neighbour);
        pendingIds[neighbourIx] = true;
      }

      cameFrom[neighbourIx] = {row: current.row, col: current.col};
      scores[neighbourIx] = score;
    }
  }
  if (!found) return [];

  const result = [{row: current.row, col: current.col}];
  while (cameFrom[getTileIndex(current)] != null) {
    current = cameFrom[getTileIndex(current)];
    result.push({row: current.row, col: current.col});
  }
  return result.reverse();
}
