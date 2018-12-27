
export type Coords = {row: number, col: number};

export function project(proj: Coords, source: Coords): void {
  proj.row = Math.floor((source.row + 1) / 2) + source.col;
  proj.col = -Math.floor(source.row / 2) + source.col;
}

export function unproject(unproj: Coords, source: Coords): void {
  unproj.row = source.row - source.col;
  unproj.col = Math.floor((source.row + source.col) / 2);
}
