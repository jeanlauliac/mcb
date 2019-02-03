import pickTile from './pickTile';
import {TILE_HALF_WIDTH, TILE_HALF_HEIGHT} from './constants';
import * as Field from './Field';
import findShortestPath, {Path} from './findShortestPath';
import {Neighbours} from './findNeighbours';
import Coords from './Coords';
import createArray from './createArray';
import Dequeue from './Dequeue';

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);

const dpr = window.devicePixelRatio || 1;
const width = window.innerWidth;
const height = window.innerHeight;
canvas.width = width * dpr;
canvas.height = height * dpr;
canvas.style.width = width + 'px';
canvas.style.height = height + 'px';

const ctx = canvas.getContext('2d');
ctx.scale(dpr, dpr);

let lastTimestamp: number;
const tickLength = Math.floor(1 / 30 * 1000); // 30 Hz

const tiles: any = document.getElementById('tiles');

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

type LocalMouseEvent = {clientX: number, clientY: number, buttons: number};
const mouseEvents = new Dequeue(8, () => ({clientX: 0, clientY: 0, buttons: 0}));

function update() {
  for (; !mouseEvents.isEmpty(); mouseEvents.shift()) {
    const ev = mouseEvents.first;
    switch (cursorMode) {
    case 'move':
      handleCameraMove(ev);
      break;
    case 'road':
      handleRoadMove(ev);
      break;
    case 'farm':
      handleFarmMove(ev);
      break;
    case 'delete':
      handleDelete(ev);
      break;
    }
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
  path: {[key: number]: Coords},
} = {current: new Coords(), isBuilding: false,
  from: new Coords(), path: {}};

const pickedTile = new Coords();
const path: Path = {
  coords: [],
  size: 0,
};
for (let i = 0; i < 512; ++i) {
  path.coords.push(new Coords());
}

const roadProj = new Coords();

function handleRoadMove(ev: LocalMouseEvent) {
  pickTile(pickedTile, ev.clientX + cameraX, ev.clientY + cameraY);
  if (!roadSelectTile.isBuilding) {
    if ((ev.buttons & 1) !== 0) {
      roadSelectTile.isBuilding = true;
      roadSelectTile.from.assign(pickedTile);
      roadSelectTile.current.row = -1;
      roadSelectTile.current.col = -1;
      roadSelectTile.path = {};
    } else {
      roadSelectTile.current.assign(pickedTile);
      return;
    }
  }
  if (!roadSelectTile.current.equals(pickedTile)) {
    roadSelectTile.current.assign(pickedTile);
    findShortestPath(path, roadSelectTile.from, roadSelectTile.current);
    roadSelectTile.path = {};
    for (let i = 0; i < path.size; ++i) {
      const cc = roadSelectTile.path[Field.getTileIndex(path.coords[i])] = new Coords();
      cc.assign(path.coords[i]);
    }
  }
  if ((ev.buttons & 1) === 0) {
    roadSelectTile.isBuilding = false;
    const {path} = roadSelectTile;
    const tileIds: Array<string> = Object.keys(path);
    for (let i = 0; i < tileIds.length; ++i) {
      const index = +tileIds[i];
      const coords = path[index];
      roadProj.projectFrom(coords);
      roadProj.col += 1;
      coords.unprojectFrom(roadProj);
      if (path[Field.getTileIndex(coords)] != null) {
        Field.setTileType(index, 'road_h');
      } else {
        Field.setTileType(index, 'road_v');
      }
    }
  }
}

const farmCoords = new Coords();

function handleFarmMove(ev: LocalMouseEvent) {
  pickTile(pickedTile, ev.clientX + cameraX, ev.clientY + cameraY);
  farmCoords.assign(pickedTile);
}

const deleteInfo: {
  isDeleting: boolean,
  toCoords: Coords,
  fromCoords: Coords,
  tiles: {[key: number]: true},
} = {
  isDeleting: false,
  fromCoords: new Coords(),
  toCoords: new Coords(),
  tiles: {},
};

function handleDelete(ev: LocalMouseEvent) {
  pickTile(pickedTile, ev.clientX + cameraX, ev.clientY + cameraY);
  const {row, col} = pickedTile;
  if (!deleteInfo.isDeleting) {
    if ((ev.buttons & 1) !== 0) {
      deleteInfo.isDeleting = true;
      deleteInfo.fromCoords.row = row;
      deleteInfo.fromCoords.col = col;
      deleteInfo.toCoords.row = -1;
      deleteInfo.toCoords.col = -1;
    } else {
      deleteInfo.toCoords.row = row;
      deleteInfo.toCoords.col = col;
      return;
    }
  }
  if (row !== deleteInfo.toCoords.row || col !== deleteInfo.toCoords.col) {
    deleteInfo.toCoords.row = row;
    deleteInfo.toCoords.col = col;
    deleteInfo.tiles = findSquare(deleteInfo.fromCoords, deleteInfo.toCoords);
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

const neighbours: Neighbours = createArray(4, () => new Coords);

const projFrom = new Coords;
const projTo = new Coords;
const unproj = new Coords;
const iter = new Coords;

function findSquare(from: Coords, to: Coords) {
  const result: {[key: number]: true} = {};
  projFrom.projectFrom(from);
  projTo.projectFrom(to);
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

  for (iter.row = projFrom.row; iter.row <= projTo.row; ++iter.row) {
    for (iter.col = projFrom.col; iter.col <= projTo.col; ++iter.col) {
      unproj.unprojectFrom(iter);
      if (unproj.row < 0 || unproj.row >= Field.height || unproj.col < 0 || unproj.col >= Field.width) {
        continue;
      }
      result[Field.getTileIndex(unproj)] = true;
    }
  }

  return result;
}

const topLeftCoords = new Coords();
const bottomRightCoords = new Coords();

type CanvasCoords = {x: number, y: number};
const canvasCoords: CanvasCoords = {x: 0, y: 0};

const farmBaseTiles = createArray(9, () => new Coords);
const drawCoords = new Coords;

function draw() {

  ctx.strokeStyle = '#a0a0a0';
  ctx.lineWidth = 1;

  pickTile(topLeftCoords, cameraX, cameraY);
  pickTile(
    bottomRightCoords,
    cameraX + width,
    cameraY + height,
  );
  const maxRow = Math.min(bottomRightCoords.row + 2, Field.height);
  const maxCol = Math.min(bottomRightCoords.col + 2, Field.width);

  for (drawCoords.row = Math.max(0, topLeftCoords.row - 1); drawCoords.row < maxRow; ++drawCoords.row) {
    for (drawCoords.col = Math.max(0, topLeftCoords.col - 1); drawCoords.col < maxCol; ++drawCoords.col) {
      drawTile(drawCoords);
    }
  }

  if (cursorMode === 'farm') {
    projFrom.projectFrom(farmCoords);
    let i = 0;
    let canBuild = true;
    for (projTo.row = projFrom.row - 1; projTo.row < projFrom.row + 2; ++projTo.row) {
      for (projTo.col = projFrom.col - 1; projTo.col < projFrom.col + 2; ++projTo.col) {
        farmBaseTiles[i].unprojectFrom(projTo);
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

const TILE_IMG_WIDTH = TILE_HALF_WIDTH * 4;

function drawTileImg(canvasCoords: CanvasCoords, index: number) {
  const dx = canvasCoords.x - TILE_HALF_WIDTH;
  const dy = canvasCoords.y - 3 * TILE_HALF_HEIGHT;
  ctx.drawImage(tiles, index * TILE_IMG_WIDTH, 0, TILE_IMG_WIDTH, TILE_HALF_HEIGHT * 8,
    dx, dy, TILE_HALF_WIDTH * 2, TILE_HALF_HEIGHT * 4);
}

function drawTile(target: Coords) {
  getCanvasCoords(canvasCoords, target);
  const tileIx = Field.getTileIndex(target);
  const tile = Field.getTile(tileIx);

  if (tile.type === 'road_v') {
    drawTileImg(canvasCoords, 1);
    buildTilePath(canvasCoords);
  } else if (tile.type === 'road_h') {
    drawTileImg(canvasCoords, 2);
    buildTilePath(canvasCoords);

  } else if (tile.type === 'grass' && !(roadSelectTile.isBuilding && roadSelectTile.path[tileIx])) {
    drawTileImg(canvasCoords, 0);
    buildTilePath(canvasCoords);

  } else {

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
  }

  if (cursorMode === 'road' && roadSelectTile.current.equals(target)) {
    ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
    ctx.fill();
  }
  if (
    cursorMode === 'delete' && deleteInfo.toCoords.equals(target) ||
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

function handleMouseEvent(ev: MouseEvent) {
  if (mouseEvents.isFull()) {
    mouseEvents.shift();
  }
  const lastEv = mouseEvents.push();
  lastEv.clientX = ev.clientX;
  lastEv.clientY = ev.clientY;
  lastEv.buttons = ev.buttons;
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
  const camMaxX = (Field.width - 1) * TILE_HALF_WIDTH * 2 - width;
  if (cameraX > camMaxX) cameraX = camMaxX;

  cameraY = camMove.camY + camMove.y - ev.clientY;
  if (cameraY < 0) cameraY = 0;
  const camMaxY = (Field.height - 1) * TILE_HALF_HEIGHT - height;
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
