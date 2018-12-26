import * as Field from './Field';
import findNeighbours, {Neighbours} from './findNeighbours';

const {getTileIndex} = Field;

const neighbours: Neighbours = [];
for (let i = 0; i < 4; ++i) {
  neighbours.push({row: 0, col: 0});
}

export default function findShortestPath(
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
) {
  let found = false;
  const visited: {[key: number]: true} = {};
  const cameFrom: {[key: number]: {row: number, col: number}} = {};
  const pending = [{row: fromRow, col: fromCol}];
  const pendingIds: {[key: number]: true} = {};
  let current = pending[0];
  pendingIds[getTileIndex(current)] = true;
  if (Field.data[getTileIndex(current)].type === 'water') {
    return [];
  }
  const scores: {[key: number]: number} = {};
  scores[getTileIndex(pending[0])] = 0;
  while (pending.length > 0) {
    current = pending.shift();
    if (current.row === toRow && current.col === toCol) {
      found = true;
      break;
    }
    const curTileIx = getTileIndex(current);
    delete pendingIds[curTileIx];
    visited[curTileIx] = true;
    findNeighbours(neighbours, current.row, current.col);
    for (let i = 0; i < neighbours.length; ++i) {
      const neighbour = neighbours[i];
      if (neighbour.row < 0 || neighbour.row >= Field.height || neighbour.col < 0 || neighbour.col >= Field.width) {
        continue;
      }
      const neighbourIx = getTileIndex(neighbour);
      if (visited[neighbourIx] || Field.data[neighbourIx].type === 'water') {
        continue;
      }
      const {row, col} = neighbour;
      const score = scores[curTileIx] + 1;
      if (!pendingIds[neighbourIx]) {
        pending.push({row, col});
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
