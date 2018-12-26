import pickTile from './pickTile';
import {TILE_HALF_WIDTH, TILE_HALF_HEIGHT} from './constants';

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ctx = canvas.getContext('2d', { alpha: false });

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

const fieldWidth = 29;
const fieldHeight = 39;

const field = (() => {
  let result = Array(fieldHeight * fieldWidth);
  for (let i = 0; i < result.length; ++i) {
    result[i] = {
      type: 'grass',
    };
  }
  return result;
})();

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
  }
}

const roadSelectTile = {row: -1, col: -1};

function handleRoadMove(ev: LocalMouseEvent) {
  const {row, col} = pickTile(ev.clientX + cameraX, ev.clientY + cameraY);
  roadSelectTile.row = row;
  roadSelectTile.col = col;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#a0a0a0';
  ctx.lineWidth = 1;

  for (let row = 0; row < fieldHeight; ++row) {
    for (let col = 0; col < fieldWidth; ++col) {
      drawTile(row, col);
    }
  }
}

function drawTile(row: number, col: number) {
  const x = col * TILE_HALF_WIDTH * 2 + (row % 2) * TILE_HALF_WIDTH - cameraX;
  const y = row * TILE_HALF_HEIGHT - cameraY;
  const tile = field[row * fieldWidth + col];

  ctx.fillStyle = (() => {
    switch (tile.type) {
      case 'grass': return '#b1e4a6';
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
    ctx.fillStyle = 'rgba(0, 255, 0, 100)';
    ctx.fill();
  }

}

const camMove = {x: 0, y: 0, camX: 0, camY: 0, moving: false};

type LocalMouseEvent = {clientX: number, clientY: number, buttons: number};

canvas.addEventListener('mousemove', ev => {
  lastMouseEv.clientX = ev.clientX;
  lastMouseEv.clientY = ev.clientY;
  lastMouseEv.buttons = ev.buttons;
});

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
    case 'Escape':
      cursorMode = 'move';
      break;
  }
});

// window.requestAnimationFrame(step);
setInterval(requestStep, 30);
