import foo from './foo';

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ctx = canvas.getContext('2d', { alpha: false });

let lastTimestamp: number;
let left = 10, top = 10;
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

function update() {

  left += 1;
  top += 1;

  if (left > canvas.width - 50) {
    left = 0;
  }
  if (top > canvas.height - 50) {
    top = 0;
  }

}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgb(200, 0, 0)';
  ctx.fillRect(Math.floor(left), Math.floor(top), 50, 50);

  ctx.fillStyle = 'rgba(0, 0, 200, 0.5)';
  ctx.fillRect(30, 30, 50, 50);

}

window.requestAnimationFrame(step);
