import pickTile from './pickTile';
import {TILE_HALF_WIDTH, TILE_HALF_HEIGHT} from './constants';
import * as Field from './Field';
import findShortestPath from './findShortestPath';

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ctx = canvas.getContext('2d');

let lastTimestamp: number;
const tickLength = Math.floor(1 / 30 * 1000); // 30 Hz

function step(timestamp: number) {
  if (!lastTimestamp) lastTimestamp = timestamp;
  while (lastTimestamp < timestamp - tickLength) {
    update();
    lastTimestamp += tickLength;
  }
  draw();
}

function requestStep() {
  window.requestAnimationFrame(step);
}

let cameraX = 70;
let cameraY = 50;
let cursorMode = 'move';
let lastMouseEv = {clientX: 0, clientY: 0, buttons: 0};

function update() {
  switch (cursorMode) {
  case 'move':
    handleCameraMove(lastMouseEv);
    break;
  case 'road':
    handleRoadMove(lastMouseEv);
    break;
  case 'delete':
    handleDelete(lastMouseEv);
    break;
  }
}

const roadSelectTile: {
  row: number,
  col: number,
  isBuilding: boolean,
  fromRow: number,
  fromCol: number,
  path: {[key: number]: true},
} = {row: -1, col: -1, isBuilding: false,
  fromRow: -1, fromCol: -1, path: {}};

function handleRoadMove(ev: LocalMouseEvent) {
  const {row, col} = pickTile(ev.clientX + cameraX, ev.clientY + cameraY);
  if (!roadSelectTile.isBuilding) {
    if ((ev.buttons & 1) !== 0) {
      roadSelectTile.isBuilding = true;
      roadSelectTile.fromRow = row;
      roadSelectTile.fromCol = col;
      roadSelectTile.row = -1;
      roadSelectTile.col = -1;
      roadSelectTile.path = {};
    } else {
      roadSelectTile.row = row;
      roadSelectTile.col = col;
      return;
    }
  }
  if (row !== roadSelectTile.row || col !== roadSelectTile.col) {
    roadSelectTile.row = row;
    roadSelectTile.col = col;
    const path = findShortestPath(roadSelectTile.fromRow, roadSelectTile.fromCol, roadSelectTile.row, roadSelectTile.col);
    roadSelectTile.path = {};
    for (let i = 0; i < path.length; ++i) {
      roadSelectTile.path[Field.getTileIndex(path[i])] = true;
    }
  }
  if ((ev.buttons & 1) === 0) {
    roadSelectTile.isBuilding = false;
    const tileIds: Array<string> = Object.keys(roadSelectTile.path);
    for (let i = 0; i < tileIds.length; ++i) {
      Field.data[+tileIds[i]].type = 'road';
    }
  }
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
  const {row, col} = pickTile(ev.clientX + cameraX, ev.clientY + cameraY);
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
  if (row !== roadSelectTile.row || col !== roadSelectTile.col) {
    deleteInfo.row = row;
    deleteInfo.col = col;
    deleteInfo.tiles = findSquare(deleteInfo.fromRow, deleteInfo.fromCol, deleteInfo.row, deleteInfo.col);
  }
  if ((ev.buttons & 1) === 0) {
    deleteInfo.isDeleting = false;
  }
}

function findSquare(fromRow: number, fromCol: number, toRow: number, toCol: number) {
  const result: {[key: number]: true} = {};
  if (fromRow > toRow) {
    const row = fromRow;
    fromRow = toRow;
    toRow = row;
  }
  if (fromCol > toCol) {
    const col = fromCol;
    fromCol = toCol;
    toCol = col;
  }
  for (let row = fromRow; row < toRow; ++row) {
    for (let col = fromCol; col < toCol; ++col) {
      result[Field.getTileIndex({row, col})] = true;
    }
  }
  return result;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#a0a0a0';
  ctx.lineWidth = 1;

  for (let row = 0; row < Field.height; ++row) {
    for (let col = 0; col < Field.width; ++col) {
      drawTile(row, col);
    }
  }
}

function drawTile(row: number, col: number) {
  const x = col * TILE_HALF_WIDTH * 2 + (row % 2) * TILE_HALF_WIDTH - cameraX;
  const y = row * TILE_HALF_HEIGHT - cameraY;
  const tileIx = row * Field.width + col;
  const tile = Field.data[tileIx];

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

  ctx.beginPath();
  ctx.moveTo(x, y - TILE_HALF_HEIGHT);
  ctx.lineTo(x + TILE_HALF_WIDTH, y);
  ctx.lineTo(x, y + TILE_HALF_HEIGHT);
  ctx.lineTo(x - TILE_HALF_WIDTH, y);

  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  if (cursorMode === 'road' && roadSelectTile.row === row && roadSelectTile.col === col) {
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

const camMove = {x: 0, y: 0, camX: 0, camY: 0, moving: false};

type LocalMouseEvent = {clientX: number, clientY: number, buttons: number};

function handleMouseEvent(ev: MouseEvent) {
  lastMouseEv.clientX = ev.clientX;
  lastMouseEv.clientY = ev.clientY;
  lastMouseEv.buttons = ev.buttons;
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
  cameraY = camMove.camY + camMove.y - ev.clientY;
}

window.addEventListener('keydown', ev => {
  switch (ev.key) {
    case 'r':
      cursorMode = 'road';
      break;
    case 'd':
      cursorMode = 'delete';
      break;
    case 'Escape':
      cursorMode = 'move';
      break;
  }
});

// window.requestAnimationFrame(step);
setInterval(requestStep, 30);
