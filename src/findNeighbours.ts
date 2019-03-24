import * as Field from "./Field";
import invariant from "./invariant";
import Coords from "./Coords";

export type Neighbours = Array<Coords>;

export default function findNeighbours(
  result: Neighbours,
  coords: Coords
): void {
  invariant(result.length === 4);
  const { row, col } = coords;
  if (row % 2 === 0) {
    result[0].set(row - 1, col);
    result[1].set(row + 1, col);
    result[2].set(row + 1, col - 1);
    result[3].set(row - 1, col - 1);
  } else {
    result[0].set(row - 1, col + 1);
    result[1].set(row + 1, col + 1);
    result[2].set(row + 1, col);
    result[3].set(row - 1, col);
  }
}
