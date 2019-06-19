import pickTile from "./pickTile";
import { TILE_HALF_WIDTH, TILE_HALF_HEIGHT } from "./constants";
import findShortestPath, { Path } from "./findShortestPath";
import findNeighbours, { Neighbours } from "./findNeighbours";
import Coords from "./Coords";
import createArray from "./createArray";
import Dequeue from "./Dequeue";
import hashInteger from "./hashInteger";
import Map from "./Map";
import { LocalMouseEvent, MouseEventType } from "./MouseEvents";
import RoadBuilder, {
  ROAD_TYPE_REVERSE_TABLE,
  ROAD_TYPE_TABLE
} from "./RoadBuilder";
import ScreenCoords from "./ScreenCoords";
import WorldCoords from "./WorldCoords";
import Bulldozer from "./Bulldozer";
import Field, { Entity } from "./Field";

const canvas = document.createElement("canvas");
document.body.appendChild(canvas);

const dpr = window.devicePixelRatio || 1;
const windowSize = new ScreenCoords(window.innerWidth, window.innerHeight);
canvas.width = windowSize.x * dpr;
canvas.height = windowSize.y * dpr;
canvas.style.width = windowSize.x + "px";
canvas.style.height = windowSize.y + "px";

const ctx = canvas.getContext("2d");
ctx.scale(dpr, dpr);
ctx.imageSmoothingEnabled = false;

let lastTimestamp: number;
const tickLength = Math.floor((1 / 30) * 1000); // 30 Hz

const tiles: any = document.getElementById("tiles");
const entities: any = document.getElementById("entities");
const pixelTiles: any = document.getElementById("pixel-tiles");

function requestStep() {
  window.requestAnimationFrame(step);
}

let flip = false;

function step(timestamp: number) {
  requestStep();
  flip = !flip;
  if (flip) return;

  if (!lastTimestamp) lastTimestamp = timestamp;
  let elapsedMs = timestamp - lastTimestamp;
  if (elapsedMs > tickLength * 2) {
    elapsedMs = tickLength * 2;
  }

  update(elapsedMs / 30);
  lastTimestamp = timestamp;

  draw();
}

let camera = new ScreenCoords();
camera.set(70, 50);

let cameraSpeed = new ScreenCoords();

let cursorMode = "move";
let mouseCoords = new ScreenCoords();

const mouseEvents = new Dequeue<LocalMouseEvent>(
  8,
  () => new LocalMouseEvent()
);

const field = new Field(new ScreenCoords(60, 100));
const fillRow = field.fillRow.bind(field);
const setRow = field.setRow.bind(field);

setRow(8, 15, ["shore_top_inner", "shore_top_inner"]);
setRow(9, 14, ["shore_top_left", "shore_top_outer", "shore_top_right"]);
setRow(10, 11, [
  "shore_top_inner",
  "shore_top_inner",
  "shore_top_inner",
  "shore_top_left",
  "water_1",
  "water_2",
  "shore_top_right",
  "shore_top_inner"
]);
setRow(11, 10, [
  "shore_top_left",
  "shore_top_outer",
  "shore_top_outer",
  "shore_top_outer",
  "water_2",
  "water_1",
  "water_2",
  "shore_top_outer",
  "shore_right_inner"
]);

setRow(12, 10, [
  "shore_top_left",
  "water_1",
  "water_2",
  "water_1",
  "water_2",
  "water_1",
  "water_2",
  "water_1",
  "shore_bottom_right"
]);

fillRow(13, 10, 17, "water");
fillRow(14, 10, 16, "water");
fillRow(15, 9, 15, "water");
fillRow(16, 9, 15, "water");
fillRow(17, 9, 15, "water");
fillRow(18, 9, 16, "water");
fillRow(19, 10, 16, "water");
fillRow(20, 10, 15, "water");
fillRow(21, 10, 13, "water");
fillRow(22, 12, 12, "water");

fillRow(21, 21, 22, "water");
fillRow(22, 21, 23, "water");
fillRow(23, 20, 23, "water");
fillRow(24, 19, 24, "water");
fillRow(25, 19, 24, "water");
fillRow(26, 19, 25, "water");
fillRow(27, 19, 25, "water");
fillRow(28, 19, 25, "water");
fillRow(29, 19, 25, "water");

fillRow(26, 4, 7, "water");
fillRow(27, 4, 7, "water");
fillRow(28, 5, 8, "water");
fillRow(29, 5, 10, "water");
fillRow(30, 8, 25, "water");
fillRow(31, 8, 24, "water");
fillRow(32, 9, 24, "water");
fillRow(33, 9, 24, "water");
fillRow(33, 10, 24, "water");
fillRow(34, 10, 24, "water");
fillRow(35, 15, 24, "water");
fillRow(36, 15, 24, "water");
fillRow(37, 15, 24, "water");

const roadBuilder = new RoadBuilder(field);
const bulldozer = new Bulldozer(field);
const camDelta = new ScreenCoords();

function update(coef: number) {
  for (; !mouseEvents.isEmpty(); mouseEvents.shift()) {
    const ev = mouseEvents.first;
    fieldCoords.assign(ev.coords).sum(camera);
    switch (cursorMode) {
      case "move":
        handleCameraMove(ev);
        break;
      case "road":
        roadBuilder.handleMouseEvent(ev.type, fieldCoords);
        break;
      case "farm":
        handleFarmMouseEvent(ev.type, fieldCoords);
        break;
      case "delete":
        bulldozer.handleMouseEvent(ev.type, fieldCoords);
        break;
    }
    mouseCoords.assign(ev.coords);
  }
  fieldCoords.assign(mouseCoords).sum(camera);
  for (let i = 0; i < keyPressCount; ++i) {
    switch (keysPresses[i]) {
      case "r":
        cursorMode = "road";
        roadBuilder.enable(fieldCoords);
        break;
      case "d":
        cursorMode = "delete";
        bulldozer.enable(fieldCoords);
        break;
      case "f":
        cursorMode = "farm";
        handleFarmMouseEvent(MouseEventType.Move, fieldCoords);
        break;
      case "Escape":
        cursorMode = "move";
        break;
    }
  }
  keyPressCount = 0;
  if (!camMove.moving) {
    camDelta.assign(cameraSpeed);
    camDelta.scale(coef);
    camera.sum(cameraSpeed);
    restrictCamera();
    cameraSpeed.scale(Math.exp(-coef / 20));
  }
}

const pickedTile = new Coords();

let farmCoords = new Coords();
const fieldCoords = new ScreenCoords();

function handleFarmMouseEvent(type: MouseEventType, fieldCoords: ScreenCoords) {
  if (type === MouseEventType.Move) {
    pickTile(pickedTile, fieldCoords);
    if (farmCoords.equals(pickedTile)) return;
    farmCoords.assign(pickedTile);

    projFrom.projectFrom(farmCoords);
    farmBaseTiles.clear();
    canBuildFarm = true;
    for (
      projTo.row = projFrom.row - 1;
      projTo.row < projFrom.row + 2;
      ++projTo.row
    ) {
      for (
        projTo.col = projFrom.col - 1;
        projTo.col < projFrom.col + 2;
        ++projTo.col
      ) {
        const coords = farmBaseTiles.push();
        coords.unprojectFrom(projTo);
        const tileIx = coords.row * field.size.x + coords.col;
        const tile = field.getTile(tileIx);
        canBuildFarm = canBuildFarm && tile.type === "grass";
      }
    }

    return;
  }
  if (type !== MouseEventType.Up) return;
  if (!canBuildFarm) return;
  const entityID = field.createEntity();
  const entity = field.getEntity(entityID);
  for (const coords of farmBaseTiles) {
    field.setTileType(field.getTileIndex(coords), "entity", entityID);
  }
  entity.type = "shack";
  entity.coords.assign(farmCoords);
  canBuildFarm = false;
}

const projFrom = new WorldCoords();
const projTo = new WorldCoords();
const unproj = new Coords();
const iter = new Coords();

const topLeftCoords = new Coords();
const bottomRightCoords = new Coords();

type CanvasCoords = { x: number; y: number };
const canvasCoords = new ScreenCoords();

const farmBaseTiles = new Dequeue(64, () => new Coords());
let canBuildFarm = false;
const drawCoords = new Coords();
const piter = new WorldCoords();

function draw() {
  ctx.strokeStyle = "#a0a0a0";
  ctx.lineWidth = 1;

  pickTile(topLeftCoords, camera);
  fieldCoords.assign(camera).sum(windowSize);
  pickTile(bottomRightCoords, fieldCoords);
  const maxRow = Math.min(bottomRightCoords.row + 2, field.size.y);
  const maxCol = Math.min(bottomRightCoords.col + 2, field.size.x);

  for (
    drawCoords.row = Math.max(0, topLeftCoords.row - 1);
    drawCoords.row < maxRow;
    ++drawCoords.row
  ) {
    for (
      drawCoords.col = Math.max(0, topLeftCoords.col - 1);
      drawCoords.col < maxCol;
      ++drawCoords.col
    ) {
      drawTile(drawCoords);
    }
  }

  if (cursorMode === "delete") {
    ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
    const sq = bulldozer.square;
    if (sq != null) {
      for (
        piter.row = sq.projFrom.row;
        piter.row <= sq.projTo.row;
        ++piter.row
      ) {
        for (
          piter.col = sq.projFrom.col;
          piter.col <= sq.projTo.col;
          ++piter.col
        ) {
          unproj.unprojectFrom(piter);
          if (!field.areCoordsValid(unproj, 1)) {
            continue;
          }
          getCanvasCoords(canvasCoords, unproj);
          buildTilePath(canvasCoords);
          ctx.fill();
        }
      }
    } else {
      getCanvasCoords(canvasCoords, bulldozer.currentCoords);
      buildTilePath(canvasCoords);
      ctx.fill();
    }
  }

  if (cursorMode === "farm") {
    ctx.fillStyle = canBuildFarm
      ? "rgba(0, 255, 0, 0.5)"
      : "rgba(255, 0, 0, 0.5)";
    for (const tile of farmBaseTiles) {
      getCanvasCoords(canvasCoords, tile);
      buildTilePath(canvasCoords);
      ctx.fill();
    }
  }

  drawMiniMap();
}

function drawMiniMap() {
  iter.set(field.size.y - 1, field.size.x - 1);
  getCanvasCoords(canvasCoords, iter);
  canvasCoords.sum(camera);

  const ratio = canvasCoords.x / canvasCoords.y;
  const height = Math.floor(80 / ratio);
  const left = windowSize.x - 100;
  ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  ctx.fillRect(left, 20, 80, height);

  const percX = camera.x / canvasCoords.x;
  const percY = camera.y / canvasCoords.y;

  ctx.strokeStyle = "rgba(255, 255, 255, 1)";
  ctx.strokeRect(
    left + percX * 80,
    20 + percY * height,
    (windowSize.x / canvasCoords.x) * 80,
    (windowSize.y / canvasCoords.y) * height
  );
}

const TILE_IMG_WIDTH = TILE_HALF_WIDTH * 4;
const TILE_IMG_HEIGHT = TILE_HALF_HEIGHT * 8;
const TILES_PER_ROW = 32;

function drawTileImg(canvasCoords: CanvasCoords, index: number) {
  const dx = canvasCoords.x - TILE_HALF_WIDTH;
  const dy = canvasCoords.y - 3 * TILE_HALF_HEIGHT;

  ctx.drawImage(
    pixelTiles,
    (index % TILES_PER_ROW) * 32,
    Math.floor(index / TILES_PER_ROW) * 32,
    32,
    32,
    dx,
    dy,
    TILE_HALF_WIDTH * 2,
    TILE_HALF_HEIGHT * 4
  );

  // ctx.drawImage(
  //   tiles,
  //   (index % 16) * TILE_IMG_WIDTH,
  //   Math.floor(index / 16) * TILE_IMG_HEIGHT,
  //   TILE_IMG_WIDTH,
  //   TILE_IMG_HEIGHT,
  //   dx,
  //   dy,
  //   TILE_HALF_WIDTH * 2,
  //   TILE_HALF_HEIGHT * 4
  // );
}

const TILE_IMG_INDICES: { [key: string]: number } = (() => {
  const rows = [
    ['grass_1', 'grass_2', 'grass_3'],

    // road_end_tr: 8,
    // road_end_bl: 9,
    // road_end_br: 10,
    // road_tee_tl: 11,
    // road_tee_tr: 12,
    // road_tee_bl: 13,
    // road_tee_br: 14,
    // road_cross: 15,

    ['water_1', 'water_2'], ['shore_top_left',
    'shore_top_inner',
    'shore_top_right',
    'shore_top_outer',
    'shore_right_inner',
    'shore_bottom_right',
],
[
    'path_straight_top_left',
    'path_straight_top_right',

    'path_turn_left',
    'path_turn_right',
    'path_turn_top',
    'path_turn_bottom',

    'path_end_top_left',
    'path_end_top_right',
    'path_end_bottom_right',
    'path_end_bottom_left',
    'path_patch',
    ]];
    const tileMap: { [key: string]: number } = {};
    for (let row = 0; row < rows.length; ++row) {
      const columns = rows[row];
      for (let col = 0; col < columns.length; ++col) {
        tileMap[columns[col]] = row * TILES_PER_ROW + col;
      }
    }
    return tileMap;
})();

function drawTile(target: Coords) {
  getCanvasCoords(canvasCoords, target);
  const tileIx = field.getTileIndex(target);
  const tile = field.getTile(tileIx);

  let type = tile.type;

  const { tileMap } = roadBuilder;
  if (cursorMode === "road" && tileMap != null) {
    const roadTile = tileMap.get(tileIx);
    if (roadTile != null) type = roadTile.type;
  }

  if (type === "entity") {
    const entity = field.getEntity(tile.entityID);
    if (entity.coords.equals(target)) {
      drawEntity(canvasCoords, entity);
    }
  } else {
    drawTileImg(canvasCoords, TILE_IMG_INDICES[type]);
  }

  if (cursorMode === "road" && roadBuilder.currentCoords.equals(target)) {
    buildTilePath(canvasCoords);
    ctx.fillStyle = "rgba(0, 255, 0, 0.5)";
    ctx.fill();
  }
}

const ITEMS_IMG_POSITION: {
  [key: string]: {
    offset: ScreenCoords;
    size: ScreenCoords;
    center: ScreenCoords;
  };
} = {
  shack: {
    offset: new ScreenCoords(0, 0),
    size: new ScreenCoords(6, 10),
    center: new ScreenCoords(3, 7)
  }
};

function drawEntity(coords: ScreenCoords, entity: Entity) {
  const data = ITEMS_IMG_POSITION[entity.type];
  const width = data.size.x * TILE_HALF_WIDTH;
  const height = data.size.y * TILE_HALF_HEIGHT;
  ctx.drawImage(
    entities,
    data.offset.x * TILE_HALF_WIDTH * 2,
    data.offset.y * TILE_HALF_HEIGHT * 2,
    width * 2,
    height * 2,
    coords.x - data.center.x * TILE_HALF_WIDTH,
    coords.y - data.center.y * TILE_HALF_HEIGHT,
    width,
    height
  );
}

function getCanvasCoords(result: CanvasCoords, coords: Coords) {
  const { row, col } = coords;
  result.x = col * TILE_HALF_WIDTH * 2 + (row % 2) * TILE_HALF_WIDTH - camera.x;
  result.y = row * TILE_HALF_HEIGHT - camera.y;
}

function buildTilePath(coords: CanvasCoords): void {
  const { x, y } = coords;
  ctx.beginPath();
  ctx.moveTo(x, y - TILE_HALF_HEIGHT);
  ctx.lineTo(x + TILE_HALF_WIDTH, y);
  ctx.lineTo(x, y + TILE_HALF_HEIGHT);
  ctx.lineTo(x - TILE_HALF_WIDTH, y);
  ctx.closePath();
}

const camMove = {
  x: 0,
  y: 0,
  camX: 0,
  camY: 0,
  moving: false,
  prev: new ScreenCoords()
};

function handleMouseEvent(type: MouseEventType, ev: MouseEvent) {
  if (mouseEvents.isFull()) {
    mouseEvents.shift();
  }
  const lastEv = mouseEvents.push();
  lastEv.coords.set(ev.clientX, ev.clientY);
  lastEv.buttons = ev.buttons;
  lastEv.button = ev.button;
  lastEv.type = type;
}

canvas.addEventListener(
  "mousemove",
  handleMouseEvent.bind(null, MouseEventType.Move)
);
canvas.addEventListener(
  "mousedown",
  handleMouseEvent.bind(null, MouseEventType.Down)
);
canvas.addEventListener(
  "mouseup",
  handleMouseEvent.bind(null, MouseEventType.Up)
);

function handleCameraMove(ev: LocalMouseEvent) {
  if (!camMove.moving) {
    if (ev.isPrimaryDown()) {
      camMove.x = ev.coords.x;
      camMove.y = ev.coords.y;
      camMove.camX = camera.x;
      camMove.camY = camera.y;
      camMove.prev.assign(camera);
      camMove.moving = true;
    }
    return;
  }
  if (ev.isPrimaryUp()) {
    camMove.moving = false;
    return;
  }

  camera.x = camMove.camX + camMove.x - ev.coords.x;
  camera.y = camMove.camY + camMove.y - ev.coords.y;
  restrictCamera();

  const newSpeedX = (camera.x - camMove.prev.x) * 2;
  const newSpeedY = (camera.y - camMove.prev.y) * 2;
  cameraSpeed.x = cameraSpeed.x * 0.2 + newSpeedX * 0.8;
  cameraSpeed.y = cameraSpeed.y * 0.2 + newSpeedY * 0.8;
  camMove.prev.assign(camera);
}

function restrictCamera() {
  if (camera.x < 0) camera.x = 0;
  const camMaxX = (field.size.x - 1) * TILE_HALF_WIDTH * 2 - windowSize.x;
  if (camera.x > camMaxX) camera.x = camMaxX;

  if (camera.y < 0) camera.y = 0;
  const camMaxY = (field.size.y - 1) * TILE_HALF_HEIGHT - windowSize.y;
  if (camera.y > camMaxY) camera.y = camMaxY;
}

const keysPresses = createArray<string>(8, () => "");
let keyPressCount = 0;

window.addEventListener("keydown", ev => {
  if (keyPressCount === 8) {
    return;
  }
  keysPresses[keyPressCount] = ev.key;
  ++keyPressCount;
});

setTimeout(requestStep, 30);
