import * as Field from "./Field";
import findNeighbours, { Neighbours } from "./findNeighbours";
import Coords from "./Coords";
import MinBinaryHeap from "./MinBinaryHeap";
import invariant from "./invariant";
import createArray from "./createArray";
import Map from "./Map";
import hashInteger from "./hashInteger";

const { getTileIndex } = Field;

const neighbours = createArray(4, () => new Coords());
const pending = new MinBinaryHeap(512, () => new Coords());
const projNeighbour = new Coords();
const projTo = new Coords();
const current = new Coords();
const dataByTiles = new Map(512, () => ({predecessor: new Coords(), score: 0}), hashInteger);

export type Path = {
  coords: Array<Coords>;
  size: number;
};

export default function findShortestPath(
  result: Path,
  from: Coords,
  to: Coords
): void {
  let found = false;
  dataByTiles.clear();
  pending.clear();
  const pendingIds: { [key: number]: true } = {};
  current.assign(from);
  if (Field.getTile(getTileIndex(current)).type === "water") {
    result.size = 0;
    return;
  }
  pending.push(0).assign(current);
  pendingIds[getTileIndex(current)] = true;

  const startTile = dataByTiles.set(getTileIndex(current));
  startTile.score = 0;
  startTile.predecessor.assign(current);

  projTo.projectFrom(to);

  while (!pending.isEmpty() && !dataByTiles.isFull()) {
    current.assign(pending.peek());
    pending.pop();
    if (current.equals(to)) {
      found = true;
      break;
    }
    const curTileIx = getTileIndex(current);
    delete pendingIds[curTileIx];

    const score = dataByTiles.get(curTileIx).score + 1;

    findNeighbours(neighbours, current);
    for (let i = 0; i < neighbours.length; ++i) {
      const neighbour = neighbours[i];
      if (
        neighbour.row < 0 ||
        neighbour.row >= Field.height ||
        neighbour.col < 0 ||
        neighbour.col >= Field.width
      ) {
        continue;
      }
      const neighbourIx = getTileIndex(neighbour);
      if (Field.getTile(neighbourIx).type === "water") {
        continue;
      }
      const { row, col } = neighbour;

      const neighbourData = dataByTiles.get(neighbourIx);
      if (neighbourData != null && score >= neighbourData.score) continue;
      if (!pendingIds[neighbourIx]) {
        projNeighbour.projectFrom(neighbour);
        const distToEnd =
          Math.abs(projTo.row - projNeighbour.row) +
          Math.abs(projTo.col - projNeighbour.col) * 2;
        const fscore = score + distToEnd;
        pending.push(fscore).assign(neighbour);
        pendingIds[neighbourIx] = true;
      }

      if (!dataByTiles.isFull()) {
        const tile = dataByTiles.set(neighbourIx);
        tile.predecessor.assign(current);
        tile.score = score;
      }
    }
  }
  if (!found) {
    result.size = 0;
    return;
  }

  result.coords[0].assign(current);
  result.size = 1;
  let nextTile = dataByTiles.get(getTileIndex(current));
  while (nextTile != null && nextTile.score > 0) {
    current.assign(nextTile.predecessor);
    invariant(result.size < result.coords.length);
    result.coords[result.size].assign(current);
    ++result.size;
    nextTile = dataByTiles.get(getTileIndex(current))
  }
}
