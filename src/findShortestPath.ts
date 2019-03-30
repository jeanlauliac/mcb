import * as Field from "./Field";
import findNeighbours, { Neighbours } from "./findNeighbours";
import Coords from "./Coords";
import MinBinaryHeap from "./MinBinaryHeap";
import invariant from "./invariant";
import createArray from "./createArray";
import Map from "./Map";
import hashInteger from "./hashInteger";
import Set from "./Set";
import Dequeue from "./Dequeue";

const { getTileIndex } = Field;

const neighbours = createArray(4, () => new Coords());
const pending = new MinBinaryHeap(512, () => new Coords());
const projNeighbour = new Coords();
const projTo = new Coords();
const current = new Coords();
const dataByTiles = new Map(
  1024,
  () => ({ predecessor: new Coords(), score: 0, direction: 0 }),
  hashInteger
);
const pendingIds = new Set(1024, hashInteger);

export type Path = {
  coords: Array<Coords>;
  size: number;
};

export default function findShortestPath(
  result: Dequeue<Coords>,
  from: Coords,
  to: Coords
): void {
  let found = false;
  dataByTiles.clear();
  pending.clear();
  pendingIds.clear();
  result.clear();

  current.assign(from);
  if (Field.getTile(getTileIndex(current)).type === "water") {
    return;
  }
  pending.push(0).assign(current);
  pendingIds.add(getTileIndex(current));

  const startTile = dataByTiles.set(getTileIndex(current));
  startTile.score = 0;
  startTile.predecessor.assign(current);
  startTile.direction = -1;

  projTo.projectFrom(to);

  while (!pending.isEmpty() && !dataByTiles.isFull()) {
    current.assign(pending.peek());
    pending.pop();
    if (current.equals(to)) {
      found = true;
      break;
    }
    const curTileIx = getTileIndex(current);
    pendingIds.delete(curTileIx);

    const tile = dataByTiles.get(curTileIx);
    const { direction } = tile;

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

      const turn = direction >= 0 ? (4 + direction - i) % 4 : 0;
      if (turn === 2) continue;

      const neighbourIx = getTileIndex(neighbour);
      if (Field.getTile(neighbourIx).type === "water") {
        continue;
      }
      const { row, col } = neighbour;

      const score = tile.score + [1.1, 1, 1, 1.2][turn];

      const neighbourData = dataByTiles.get(neighbourIx);
      if (neighbourData != null && score >= neighbourData.score) continue;
      if (!pendingIds.has(neighbourIx)) {
        projNeighbour.projectFrom(neighbour);
        const distToEnd =
          Math.abs(projTo.row - projNeighbour.row) +
          Math.abs(projTo.col - projNeighbour.col);
        const fscore = score + distToEnd;
        pending.push(fscore).assign(neighbour);
        pendingIds.add(neighbourIx);
      }

      if (!dataByTiles.isFull()) {
        const tile = dataByTiles.set(neighbourIx);
        tile.predecessor.assign(current);
        tile.score = score;
        tile.direction = i;
      }
    }
  }
  if (!found) return;

  result.push().assign(current);
  let nextTile = dataByTiles.get(getTileIndex(current));
  while (nextTile != null && nextTile.score > 0) {
    result.push().assign(nextTile.predecessor);
    nextTile = dataByTiles.get(getTileIndex(nextTile.predecessor));
  }
}
