import * as Field from './Field';
import findNeighbours, {Neighbours} from './findNeighbours';
import {Coords, createCoords, copyCoords, project, areCoordsEqual} from './Coords';
import MinBinaryHeap from './MinBinaryHeap';
import invariant from './invariant';
import createArray from './createArray';

const {getTileIndex} = Field;

const neighbours = createArray(4, () => ({row: 0, col: 0}));
const pending = new MinBinaryHeap(512, createCoords);
const projNeighbour = createCoords();
const projTo = createCoords();
const current = createCoords();

export type Path = {
  coords: Array<Coords>,
  size: number,
};

export default function findShortestPath(
  result: Path,
  from: Coords,
  to: Coords,
): void {
  let found = false;
  const cameFrom: {[key: number]: {row: number, col: number}} = {};
  pending.clear();
  const pendingIds: {[key: number]: true} = {};
  copyCoords(current, from);
  if (Field.data[getTileIndex(current)].type === 'water') {
    result.size = 0;
    return;
  }
  copyCoords(pending.push(0), current);
  pendingIds[getTileIndex(current)] = true;

  const scores: {[key: number]: number} = {};
  scores[getTileIndex(current)] = 0;

  project(projTo, to);

  while (!pending.isEmpty()) {
    copyCoords(current, pending.peek());
    pending.pop();
    if (areCoordsEqual(current, to)) {
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
  if (!found) {
    result.size = 0;
    return;
  }

  copyCoords(result.coords[0], current);
  result.size = 1;
  while (cameFrom[getTileIndex(current)] != null) {
    copyCoords(current, cameFrom[getTileIndex(current)]);
    invariant(result.size < result.coords.length);
    copyCoords(result.coords[result.size], current);
    ++result.size;
  }
}
