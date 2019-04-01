import * as Field from "./Field";
import findNeighbours, { Neighbours } from "./findNeighbours";
import Coords from "./Coords";
import WorldCoords from './WorldCoords';
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
const projNeighbour = new WorldCoords();
const projTo = new WorldCoords();
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

/*

Implement the A* algo.

*/
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
        neighbour.row < 1 ||
        neighbour.row >= Field.height - 1 ||
        neighbour.col < 1 ||
        neighbour.col >= Field.width - 1
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

      // We prefer turning left (cost of 4) than going straight (5), and we
      // prefer going straight than turning right (6). By having this
      // priorities, we avoid having many different possible shortest paths with
      // the same cost. This makes the tool for drawing roads nicely
      // predictable, an important feature for a city builder. The effect of
      // this specific ordering is:
      //
      //   * we'll favor the straightest path if we can reach the end by turning
      //     one or more times to the left. If there is no obstacle, we'll turn
      //     just once. If there are obstacles, we'll go around in a rectangle
      //     shape. Going in zig-zag would have a higher cost, because right
      //     turns have a cost higher than going straight.
      //
      //   * if we can only reach the end by turning right, we'll follow the
      //     limit of the obstacle closely. This is because doing many zigzags
      //     left-right allows us to achieve the smallest score by
      //     counterbalancing the high cost of right turns by the low cost of
      //     left turns. Going in straight lines would have a higher cost.
      //
      const score = tile.score + [5, 4, 4, 6][turn];

      const neighbourData = dataByTiles.get(neighbourIx);
      if (neighbourData != null && score >= neighbourData.score) continue;
      if (!pendingIds.has(neighbourIx)) {
        projNeighbour.projectFrom(neighbour);

        // Heuristic needs to represent the smallest real possible cost. If it
        // is any higher, the algo won't bother trying to find that smallest
        // cost. For example if we use 5 as a multiplier, it'll just settle by
        // zigzaging left-right, because 5 is the average of left-turn (4)
        // and right-turn (6) costs.
        const distToEnd =
          (Math.abs(projTo.row - projNeighbour.row) +
          Math.abs(projTo.col - projNeighbour.col)) * 4;
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
