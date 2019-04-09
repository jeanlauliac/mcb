import pickTile from "./pickTile";
import { TILE_HALF_WIDTH, TILE_HALF_HEIGHT } from "./constants";
import * as Field from "./Field";
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

const canvas = document.createElement("canvas");
document.body.appendChild(canvas);

const dpr = window.devicePixelRatio || 1;
const width = window.innerWidth;
const height = window.innerHeight;
canvas.width = width * dpr;
canvas.height = height * dpr;
canvas.style.width = width + "px";
canvas.style.height = height + "px";

const ctx = canvas.getContext("2d");
ctx.scale(dpr, dpr);

let lastTimestamp: number;
const tickLength = Math.floor((1 / 30) * 1000); // 30 Hz

const tiles: any = document.getElementById("tiles");

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
let lastMouseEv = new LocalMouseEvent();
let hasMouseEv = false;

const mouseEvents = new Dequeue<LocalMouseEvent>(
  8,
  () => new LocalMouseEvent()
);

const roadBuilder = new RoadBuilder();
const camDelta = new ScreenCoords();

function update(coef: number) {
  for (; !mouseEvents.isEmpty(); mouseEvents.shift()) {
    const ev = mouseEvents.first;
    switch (cursorMode) {
      case "move":
        handleCameraMove(ev);
        break;
      case "road":
        roadBuilder.handleMouseEvent(ev, camera);
        break;
      case "farm":
        handleFarmMove(ev);
        break;
      case "delete":
        handleDelete(ev);
        break;
    }
    Object.assign(lastMouseEv, ev);
  }
  for (let i = 0; i < keyPressCount; ++i) {
    switch (keysPresses[i]) {
      case "r":
        cursorMode = "road";
        roadBuilder.enable(lastMouseEv, camera);
        break;
      case "d":
        cursorMode = "delete";
        break;
      case "f":
        cursorMode = "farm";
        handleFarmMove(lastMouseEv);
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

const farmCoords = new Coords();

function handleFarmMove(ev: LocalMouseEvent) {
  pickTile(pickedTile, ev.clientX + camera.x, ev.clientY + camera.y);
  farmCoords.assign(pickedTile);
}

const deleteInfo: {
  isDeleting: boolean;
  toCoords: Coords;
  fromCoords: Coords;
  square: Square;
} = {
  isDeleting: false,
  fromCoords: new Coords(),
  toCoords: new Coords(),
  square: { projFrom: new WorldCoords(), projTo: new WorldCoords() }
};

function handleDelete(ev: LocalMouseEvent) {
  pickTile(pickedTile, ev.clientX + camera.x, ev.clientY + camera.y);
  const { row, col } = pickedTile;
  if (!deleteInfo.isDeleting) {
    if (ev.isPrimaryDown()) {
      deleteInfo.isDeleting = true;
      deleteInfo.fromCoords.assign(pickedTile);
      deleteInfo.toCoords.set(-1, -1);
    } else {
      deleteInfo.toCoords.assign(pickedTile);
      return;
    }
  }
  if (!deleteInfo.toCoords.equals(pickedTile)) {
    deleteInfo.toCoords.assign(pickedTile);
    projectSquare(
      deleteInfo.square,
      deleteInfo.fromCoords,
      deleteInfo.toCoords
    );
  }
  if (ev.isPrimaryUp()) {
    deleteInfo.isDeleting = false;
    const sq = deleteInfo.square;
    for (piter.row = sq.projFrom.row; piter.row <= sq.projTo.row; ++piter.row) {
      for (
        piter.col = sq.projFrom.col;
        piter.col <= sq.projTo.col;
        ++piter.col
      ) {
        unproj.unprojectFrom(piter);
        if (!Field.areCoordsValid(unproj, 1)) {
          continue;
        }
        const ix = Field.getTileIndex(unproj);
        const tile = Field.getTile(ix);
        if (ROAD_TYPE_REVERSE_TABLE[tile.type] != null) {
          Field.setTileType(ix, "grass");
        }
      }
    }

    piter.row = sq.projFrom.row - 1;
    for (piter.col = sq.projFrom.col; piter.col <= sq.projTo.col; ++piter.col) {
      cleanupDeletedRoadEdge(piter, 0b1011);
    }

    piter.row = sq.projTo.row + 1;
    for (piter.col = sq.projFrom.col; piter.col <= sq.projTo.col; ++piter.col) {
      cleanupDeletedRoadEdge(piter, 0b1110);
    }

    piter.col = sq.projFrom.col - 1;
    for (piter.row = sq.projFrom.row; piter.row <= sq.projTo.row; ++piter.row) {
      cleanupDeletedRoadEdge(piter, 0b0111);
    }

    piter.col = sq.projTo.col + 1;
    for (piter.row = sq.projFrom.row; piter.row <= sq.projTo.row; ++piter.row) {
      cleanupDeletedRoadEdge(piter, 0b1101);
    }
  }
}

function cleanupDeletedRoadEdge(coords: WorldCoords, maskFilter: number): void {
  unproj.unprojectFrom(coords);
  if (!Field.areCoordsValid(unproj, 1)) {
    return;
  }
  const ix = Field.getTileIndex(unproj);
  const tile = Field.getTile(ix);

  let mask = ROAD_TYPE_REVERSE_TABLE[tile.type];
  if (mask == null) return;
  mask &= maskFilter;
  Field.setTileType(ix, ROAD_TYPE_TABLE[mask] || "grass");
}

const projFrom = new WorldCoords();
const projTo = new WorldCoords();
const unproj = new Coords();
const iter = new Coords();

type Square = { projFrom: WorldCoords; projTo: WorldCoords };

function projectSquare(res: Square, from: Coords, to: Coords): void {
  res.projFrom.projectFrom(from);
  res.projTo.projectFrom(to);
  if (res.projFrom.row > res.projTo.row) {
    const row = res.projTo.row;
    res.projTo.row = res.projFrom.row;
    res.projFrom.row = row;
  }
  if (res.projFrom.col > res.projTo.col) {
    const col = res.projTo.col;
    res.projTo.col = res.projFrom.col;
    res.projFrom.col = col;
  }
}

const topLeftCoords = new Coords();
const bottomRightCoords = new Coords();

type CanvasCoords = { x: number; y: number };
const canvasCoords: CanvasCoords = { x: 0, y: 0 };

const farmBaseTiles = createArray(9, () => new Coords());
const drawCoords = new Coords();
const piter = new WorldCoords();

function draw() {
  ctx.strokeStyle = "#a0a0a0";
  ctx.lineWidth = 1;

  pickTile(topLeftCoords, camera.x, camera.y);
  pickTile(bottomRightCoords, camera.x + width, camera.y + height);
  const maxRow = Math.min(bottomRightCoords.row + 2, Field.height);
  const maxCol = Math.min(bottomRightCoords.col + 2, Field.width);

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
    if (deleteInfo.isDeleting) {
      const sq = deleteInfo.square;
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
          if (!Field.areCoordsValid(unproj, 1)) {
            continue;
          }
          getCanvasCoords(canvasCoords, unproj);
          buildTilePath(canvasCoords);
          ctx.fill();
        }
      }
    } else {
      getCanvasCoords(canvasCoords, deleteInfo.toCoords);
      buildTilePath(canvasCoords);
      ctx.fill();
    }
  }

  if (cursorMode === "farm") {
    projFrom.projectFrom(farmCoords);
    let i = 0;
    let canBuild = true;
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
        farmBaseTiles[i].unprojectFrom(projTo);
        const tileIx =
          farmBaseTiles[i].row * Field.width + farmBaseTiles[i].col;
        const tile = Field.getTile(tileIx);
        canBuild = canBuild && tile.type === "grass";
        ++i;
      }
    }

    ctx.fillStyle = canBuild ? "rgba(0, 255, 0, 0.5)" : "rgba(255, 0, 0, 0.5)";
    for (i = 0; i < farmBaseTiles.length; ++i) {
      getCanvasCoords(canvasCoords, farmBaseTiles[i]);
      buildTilePath(canvasCoords);
      ctx.fill();
    }
  }
}

const TILE_IMG_WIDTH = TILE_HALF_WIDTH * 4;
const TILE_IMG_HEIGHT = TILE_HALF_HEIGHT * 8;

function drawTileImg(canvasCoords: CanvasCoords, index: number) {
  const dx = canvasCoords.x - TILE_HALF_WIDTH;
  const dy = canvasCoords.y - 3 * TILE_HALF_HEIGHT;
  ctx.drawImage(
    tiles,
    (index % 16) * TILE_IMG_WIDTH,
    Math.floor(index / 16) * TILE_IMG_HEIGHT,
    TILE_IMG_WIDTH,
    TILE_HALF_HEIGHT * 8,
    dx,
    dy,
    TILE_HALF_WIDTH * 2,
    TILE_HALF_HEIGHT * 4
  );
}

const TILE_IMG_INDICES: { [key: string]: number } = {
  road_v: 1,
  road_h: 2,
  road_turn_left: 3,
  road_turn_right: 4,
  road_turn_top: 5,
  road_turn_bottom: 6,
  road_end_tl: 7,
  road_end_tr: 8,
  road_end_bl: 9,
  road_end_br: 10,
  road_tee_tl: 11,
  road_tee_tr: 12,
  road_tee_bl: 13,
  road_tee_br: 14,
  road_cross: 15,
  water: 16
};

function drawTile(target: Coords) {
  getCanvasCoords(canvasCoords, target);
  const tileIx = Field.getTileIndex(target);
  const tile = Field.getTile(tileIx);
  let type = tile.type;

  const { tileMap } = roadBuilder;
  if (cursorMode === "road" && tileMap != null) {
    const roadTile = tileMap.get(tileIx);
    if (roadTile != null) type = roadTile.type;
  }

  if (TILE_IMG_INDICES[type] != null) {
    drawTileImg(canvasCoords, TILE_IMG_INDICES[type]);
  } else if (type === "grass") {
    drawTileImg(canvasCoords, 0);
  }

  if (cursorMode === "road" && roadBuilder.currentCoords.equals(target)) {
    buildTilePath(canvasCoords);
    ctx.fillStyle = "rgba(0, 255, 0, 0.5)";
    ctx.fill();
  }
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

const camMove = { x: 0, y: 0, camX: 0, camY: 0, moving: false, prev: new ScreenCoords() };

function handleMouseEvent(type: MouseEventType, ev: MouseEvent) {
  if (mouseEvents.isFull()) {
    mouseEvents.shift();
  }
  const lastEv = mouseEvents.push();
  lastEv.clientX = ev.clientX;
  lastEv.clientY = ev.clientY;
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
      camMove.x = ev.clientX;
      camMove.y = ev.clientY;
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

  camera.x = camMove.camX + camMove.x - ev.clientX;
  camera.y = camMove.camY + camMove.y - ev.clientY;
  restrictCamera();

  const newSpeedX = (camera.x - camMove.prev.x) * 2;
  const newSpeedY = (camera.y - camMove.prev.y) * 2;
  cameraSpeed.x = cameraSpeed.x * 0.2 + newSpeedX * 0.8;
  cameraSpeed.y = cameraSpeed.y * 0.2 + newSpeedY * 0.8;
  camMove.prev.assign(camera);
}

function restrictCamera() {
  if (camera.x < 0) camera.x = 0;
  const camMaxX = (Field.width - 1) * TILE_HALF_WIDTH * 2 - width;
  if (camera.x > camMaxX) camera.x = camMaxX;

  if (camera.y < 0) camera.y = 0;
  const camMaxY = (Field.height - 1) * TILE_HALF_HEIGHT - height;
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
