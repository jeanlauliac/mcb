
export type Coords = {row: number, col: number};

export function project(proj: Coords, source: Coords): void {
  proj.row = Math.floor((source.row + 1) / 2) + source.col;
  proj.col = -Math.floor(source.row / 2) + source.col;
}

export function unproject(unproj: Coords, source: Coords): void {
  unproj.row = source.row - source.col;
  unproj.col = Math.floor((source.row + source.col) / 2);
}

export function createCoords(): Coords {
  return {row: -1, col: -1};
}

export function copyCoords(copy: Coords, source: Coords): void {
  copy.row = source.row;
  copy.col = source.col;
}

export function areCoordsEqual(a: Coords, b: Coords): boolean {
  return a.row === b.row && a.col === b.col;
}
