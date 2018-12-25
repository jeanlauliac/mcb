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

const fieldWidth = 30;
const fieldHeight = 50;

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

function update() {

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

}

const camMove = {x: 0, y: 0, camX: 0, camY: 0, moving: false};

canvas.addEventListener('mousemove', ev => {
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
});

window.requestAnimationFrame(step);
