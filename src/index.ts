import pickTile from './pickTile';
import {TILE_HALF_WIDTH, TILE_HALF_HEIGHT} from './constants';
import * as Field from './Field';
import findShortestPath, {Path} from './findShortestPath';
import {Neighbours} from './findNeighbours';
import {Coords, project, unproject, createCoords, copyCoords, areCoordsEqual} from './Coords';
import createArray from './createArray';

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ctx = canvas.getContext('2d');

let lastTimestamp: number;
const tickLength = Math.floor(1 / 30 * 1000); // 30 Hz

function requestStep() {
  window.requestAnimationFrame(step);
}

function step(timestamp: number) {
  setTimeout(requestStep, tickLength);
  if (!lastTimestamp) lastTimestamp = timestamp;
  while (lastTimestamp < timestamp - tickLength) {
    update();
    lastTimestamp += tickLength;
  }
  draw();
}

let cameraX = 70;
let cameraY = 50;
let cursorMode = 'move';
let lastMouseEv = {clientX: 0, clientY: 0, buttons: 0};
let hasMouseEv = false;

function update() {
  if (hasMouseEv) {
    switch (cursorMode) {
    case 'move':
      handleCameraMove(lastMouseEv);
      break;
    case 'road':
      handleRoadMove(lastMouseEv);
      break;
    case 'farm':
      handleFarmMove(lastMouseEv);
      break;
    case 'delete':
      handleDelete(lastMouseEv);
      break;
    }
    hasMouseEv = false;
  }
  for (let i = 0; i < keyPressCount; ++i) {
    switch (keysPresses[i]) {
      case 'r':
        cursorMode = 'road';
        break;
      case 'd':
        cursorMode = 'delete';
        break;
      case 'f':
        cursorMode = 'farm';
        handleFarmMove(lastMouseEv);
        break;
      case 'Escape':
        cursorMode = 'move';
        break;
    }
  }
  keyPressCount = 0;
}

const roadSelectTile: {
  current: Coords,
  isBuilding: boolean,
  from: Coords,
  path: {[key: number]: true},
} = {current: createCoords(), isBuilding: false,
  from: createCoords(), path: {}};

const pickedTile = {row: 0, col: 0};
const path: Path = {
  coords: [],
  size: 0,
};
for (let i = 0; i < 512; ++i) {
  path.coords.push(createCoords());
}

function handleRoadMove(ev: LocalMouseEvent) {
  pickTile(pickedTile, ev.clientX + cameraX, ev.clientY + cameraY);
  if (!roadSelectTile.isBuilding) {
    if ((ev.buttons & 1) !== 0) {
      roadSelectTile.isBuilding = true;
      copyCoords(roadSelectTile.from, pickedTile);
      roadSelectTile.current.row = -1;
      roadSelectTile.current.col = -1;
      roadSelectTile.path = {};
    } else {
      copyCoords(roadSelectTile.current, pickedTile);
      return;
    }
  }
  if (!areCoordsEqual(roadSelectTile.current, pickedTile)) {
    copyCoords(roadSelectTile.current, pickedTile);
    findShortestPath(path, roadSelectTile.from, roadSelectTile.current);
    roadSelectTile.path = {};
    for (let i = 0; i < path.size; ++i) {
      roadSelectTile.path[Field.getTileIndex(path.coords[i])] = true;
    }
  }
  if ((ev.buttons & 1) === 0) {
    roadSelectTile.isBuilding = false;
    const tileIds: Array<string> = Object.keys(roadSelectTile.path);
    for (let i = 0; i < tileIds.length; ++i) {
      Field.setTileType(+tileIds[i], 'road');
    }
  }
}

const farmCoords = createCoords();

function handleFarmMove(ev: LocalMouseEvent) {
  pickTile(pickedTile, ev.clientX + cameraX, ev.clientY + cameraY);
  copyCoords(farmCoords, pickedTile);
}

const deleteInfo: {
  isDeleting: boolean,
  row: number,
  col: number,
  fromRow: number,
  fromCol: number,
  tiles: {[key: number]: true},
} = {
  isDeleting: false,
  row: -1,
  col: -1,
  fromRow: -1,
  fromCol: -1,
  tiles: {},
};

function handleDelete(ev: LocalMouseEvent) {
  pickTile(pickedTile, ev.clientX + cameraX, ev.clientY + cameraY);
  const {row, col} = pickedTile;
  if (!deleteInfo.isDeleting) {
    if ((ev.buttons & 1) !== 0) {
      deleteInfo.isDeleting = true;
      deleteInfo.fromRow = row;
      deleteInfo.fromCol = col;
      deleteInfo.row = -1;
      deleteInfo.col = -1;
    } else {
      deleteInfo.row = row;
      deleteInfo.col = col;
      return;
    }
  }
  if (row !== deleteInfo.row || col !== deleteInfo.col) {
    deleteInfo.row = row;
    deleteInfo.col = col;
    deleteInfo.tiles = findSquare({row: deleteInfo.fromRow, col: deleteInfo.fromCol}, {row: deleteInfo.row, col: deleteInfo.col});
  }
  if ((ev.buttons & 1) === 0) {
    deleteInfo.isDeleting = false;
    const tileIds: Array<string> = Object.keys(deleteInfo.tiles);
    for (let i = 0; i < tileIds.length; ++i) {
      const ix = +tileIds[i];
      const tile = Field.getTile(ix);
      if (tile.type === 'road') {
        Field.setTileType(ix, 'grass');
      }
    }
  }
}

const neighbours: Neighbours = [];
for (let i = 0; i < 4; ++i) {
  neighbours.push({row: 0, col: 0});
}

const projFrom: Coords = {row: 0, col: 0};
const projTo: Coords = {row: 0, col: 0};
const unproj: Coords = {row: 0, col: 0};

function findSquare(from: Coords, to: Coords) {
  const result: {[key: number]: true} = {};
  project(projFrom, from);
  project(projTo, to);
  if (projFrom.row > projTo.row) {
    const row = projTo.row;
    projTo.row = projFrom.row;
    projFrom.row = row;
  }
  if (projFrom.col > projTo.col) {
    const col = projTo.col;
    projTo.col = projFrom.col;
    projFrom.col = col;
  }

  for (let row = projFrom.row; row <= projTo.row; ++row) {
    for (let col = projFrom.col; col <= projTo.col; ++col) {
      unproject(unproj, {row, col});
      if (unproj.row < 0 || unproj.row >= Field.height || unproj.col < 0 || unproj.col >= Field.width) {
        continue;
      }
      result[Field.getTileIndex(unproj)] = true;
    }
  }

  return result;
}

const topLeftCoords = createCoords();
const bottomRightCoords = createCoords();

type CanvasCoords = {x: number, y: number};
const canvasCoords: CanvasCoords = {x: 0, y: 0};

const farmBaseTiles = createArray(9, createCoords);

function draw() {

  ctx.strokeStyle = '#a0a0a0';
  ctx.lineWidth = 1;

  pickTile(topLeftCoords, cameraX, cameraY);
  pickTile(
    bottomRightCoords,
    cameraX + canvas.width,
    cameraY + canvas.height,
  );
  const maxRow = Math.min(bottomRightCoords.row + 2, Field.height);
  const maxCol = Math.min(bottomRightCoords.col + 2, Field.width);

  for (let row = Math.max(0, topLeftCoords.row - 1); row < maxRow; ++row) {
    for (let col = Math.max(0, topLeftCoords.col - 1); col < maxCol; ++col) {
      drawTile(row, col);
    }
  }

  if (cursorMode === 'farm') {
    project(projFrom, farmCoords);
    let i = 0;
    let canBuild = true;
    for (projTo.row = projFrom.row - 1; projTo.row < projFrom.row + 2; ++projTo.row) {
      for (projTo.col = projFrom.col - 1; projTo.col < projFrom.col + 2; ++projTo.col) {
        unproject(farmBaseTiles[i], projTo);
        const tileIx = farmBaseTiles[i].row * Field.width + farmBaseTiles[i].col;
        const tile = Field.getTile(tileIx);
        canBuild = canBuild && (tile.type === 'grass');
        ++i;
      }
    }

    ctx.fillStyle = canBuild ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';
    for (i = 0; i < farmBaseTiles.length; ++i) {
      getCanvasCoords(canvasCoords, farmBaseTiles[i]);
      buildTilePath(canvasCoords);
      ctx.fill();
    }
  }
}

function drawTile(row: number, col: number) {
  getCanvasCoords(canvasCoords, {row, col});
  const tileIx = Field.getTileIndex({row, col});
  const tile = Field.getTile(tileIx);

  ctx.fillStyle = (() => {
    if (roadSelectTile.isBuilding && roadSelectTile.path[tileIx]) {
      return '#f5f5d2';
    }
    switch (tile.type) {
      case 'grass': return '#b1e4a6';
      case 'water': return '#2d5cab';
      case 'road': return '#f5f5d2';
      default: return '#000';
    }
  })();

  buildTilePath(canvasCoords);
  ctx.fill();
  ctx.stroke();

  if (cursorMode === 'road' && areCoordsEqual(roadSelectTile.current, {row, col})) {
    ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
    ctx.fill();
  }
  if (
    cursorMode === 'delete' && deleteInfo.row === row && deleteInfo.col === col ||
    deleteInfo.isDeleting && deleteInfo.tiles[tileIx]
  ) {
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.fill();
  }

}

function getCanvasCoords(result: CanvasCoords, coords: Coords) {
  const {row, col} = coords;
  result.x = col * TILE_HALF_WIDTH * 2 + (row % 2) * TILE_HALF_WIDTH - cameraX;
  result.y = row * TILE_HALF_HEIGHT - cameraY;
}

function buildTilePath(coords: CanvasCoords): void {
  const {x, y} = coords;
  ctx.beginPath();
  ctx.moveTo(x, y - TILE_HALF_HEIGHT);
  ctx.lineTo(x + TILE_HALF_WIDTH, y);
  ctx.lineTo(x, y + TILE_HALF_HEIGHT);
  ctx.lineTo(x - TILE_HALF_WIDTH, y);
  ctx.closePath();
}

const camMove = {x: 0, y: 0, camX: 0, camY: 0, moving: false};

type LocalMouseEvent = {clientX: number, clientY: number, buttons: number};

function handleMouseEvent(ev: MouseEvent) {
  lastMouseEv.clientX = ev.clientX;
  lastMouseEv.clientY = ev.clientY;
  lastMouseEv.buttons = ev.buttons;
  hasMouseEv = true;
}

canvas.addEventListener('mousemove', handleMouseEvent);
canvas.addEventListener('mousedown', handleMouseEvent);
canvas.addEventListener('mouseup', handleMouseEvent);

function handleCameraMove(ev: LocalMouseEvent) {
  if (!camMove.moving) {
    if ((ev.buttons & 1) !== 0) {
      camMove.x = ev.clientX;
      camMove.y = ev.clientY;
      camMove.camX = cameraX;
      camMove.camY = cameraY;
      camMove.moving = true;
    }
    return;
  }
  if ((ev.buttons & 1) === 0) {
    camMove.moving = false;
    return;
  }

  cameraX = camMove.camX + camMove.x - ev.clientX;
  if (cameraX < 0) cameraX = 0;
  const camMaxX = (Field.width - 1) * TILE_HALF_WIDTH * 2 - canvas.width;
  if (cameraX > camMaxX) cameraX = camMaxX;

  cameraY = camMove.camY + camMove.y - ev.clientY;
  if (cameraY < 0) cameraY = 0;
  const camMaxY = (Field.height - 1) * TILE_HALF_HEIGHT - canvas.height;
  if (cameraY > camMaxY) cameraY = camMaxY;
}

const keysPresses = createArray<string>(8, () => '');
let keyPressCount = 0;

window.addEventListener('keydown', ev => {
  if (keyPressCount === 8) {
    return;
  }
  keysPresses[keyPressCount] = ev.key;
  ++keyPressCount;
});

setTimeout(requestStep, 30);
