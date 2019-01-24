import * as Field from './Field';
import findNeighbours, {Neighbours} from './findNeighbours';
import Coords from './Coords';
import MinBinaryHeap from './MinBinaryHeap';
import invariant from './invariant';
import createArray from './createArray';

const {getTileIndex} = Field;

const neighbours = createArray(4, () => new Coords);
const pending = new MinBinaryHeap(512, () => new Coords);
const projNeighbour = new Coords;
const projTo = new Coords;
const current = new Coords;

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
  const cameFrom: {[key: number]: Coords} = {};
  pending.clear();
  const pendingIds: {[key: number]: true} = {};
  current.assign(from);
  if (Field.getTile(getTileIndex(current)).type === 'water') {
    result.size = 0;
    return;
  }
  pending.push(0).assign(current);
  pendingIds[getTileIndex(current)] = true;

  const scores: {[key: number]: number} = {};
  scores[getTileIndex(current)] = 0;

  projTo.projectFrom(to);

  while (!pending.isEmpty()) {
    current.assign(pending.peek());
    pending.pop();
    if (current.equals(to)) {
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
      if (Field.getTile(neighbourIx).type === 'water') {
        continue;
      }
      const {row, col} = neighbour;
      const score = scores[curTileIx] + 1;

      if (scores[neighbourIx] != null && score >= scores[neighbourIx]) continue;
      if (!pendingIds[neighbourIx]) {
        projNeighbour.projectFrom(neighbour);
        const distToEnd = Math.abs(projTo.row - projNeighbour.row)
          + Math.abs(projTo.col - projNeighbour.col) * 2;
        const fscore = score + distToEnd;
        pending.push(fscore).assign(neighbour);
        pendingIds[neighbourIx] = true;
      }

      cameFrom[neighbourIx] = new Coords();
      cameFrom[neighbourIx].assign(current);
      scores[neighbourIx] = score;
    }
  }
  if (!found) {
    result.size = 0;
    return;
  }

  result.coords[0].assign(current);
  result.size = 1;
  while (cameFrom[getTileIndex(current)] != null) {
    current.assign(cameFrom[getTileIndex(current)]);
    invariant(result.size < result.coords.length);
    result.coords[result.size].assign(current);
    ++result.size;
  }
}
