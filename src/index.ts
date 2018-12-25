import foo from './foo';

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ctx = canvas.getContext('2d', { alpha: false });

let lastTimestamp: number;
const tickLength = Math.floor(1 / 30 * 1000); // 30 Hz

function step(timestamp: number) {
  window.requestAnimationFrame(step);

  if (!lastTimestamp) lastTimestamp = timestamp;
  while (lastTimestamp < timestamp - tickLength) {
    update();
    lastTimestamp += tickLength;
  }
  draw();
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

let cameraX = -70;
let cameraY = -50;
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

function handleRoadMove(ev: LocalMouseEvent) {
  pickTile(ev.clientX, ev.clientY);
}

const tileHeight = 40;
const tileHalfWidth = Math.floor(tileHeight * Math.sqrt(3) / 2);
const tileHalfHeight = Math.floor(tileHeight / 2);

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgb(50, 50, 50)';
  ctx.lineWidth = 1;

  for (let row = 0; row < fieldHeight; ++row) {
    for (let col = 0; col < fieldWidth; ++col) {
      drawTile(row, col);
    }
  }
}

function drawTile(row: number, col: number) {
  const x = col * tileHalfWidth * 2 + (row % 2) * tileHalfWidth - cameraX;
  const y = row * tileHalfHeight - cameraY;
  const tile = field[row * fieldWidth + col];

  ctx.fillStyle = (() => {
    switch (tile.type) {
      case 'grass': return '#b1e4a6';
      default: return '#000';
    }
  })();

  ctx.beginPath();
  ctx.moveTo(x, y - tileHalfHeight);
  ctx.lineTo(x + tileHalfWidth, y);
  ctx.lineTo(x, y + tileHalfHeight);
  ctx.lineTo(x - tileHalfWidth, y);

  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  if (cursorMode === 'road' && pickedTile.row === row && pickedTile.col === col) {
    ctx.fillStyle = 'rgb(200, 0, 0)';
    ctx.fill();
  }

}

const pickedTile = {row: 0, col: 0};

function pickTile(x: number, y: number) {
  let row = Math.floor((y + cameraY) / tileHalfHeight);
  let col = Math.floor((x + cameraX) / (tileHalfWidth * 2));
  pickedTile.row = row;
  pickedTile.col = col;
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

window.requestAnimationFrame(step);
