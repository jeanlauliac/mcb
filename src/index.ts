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
let cursorMode = "move";
let lastMouseEv = { clientX: 0, clientY: 0, buttons: 0 };
let hasMouseEv = false;

type LocalMouseEvent = { clientX: number; clientY: number; buttons: number };
const mouseEvents = new Dequeue(8, () => ({
  clientX: 0,
  clientY: 0,
  buttons: 0
}));

function update() {
  for (; !mouseEvents.isEmpty(); mouseEvents.shift()) {
    const ev = mouseEvents.first;
    switch (cursorMode) {
      case "move":
        handleCameraMove(ev);
        break;
      case "road":
        handleRoadMove(ev);
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
        roadSelectTile.isBuilding = false;
        handleRoadMove(lastMouseEv);
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
}

const roadSelectTile: {
  current: Coords;
  isBuilding: boolean;
  from: Coords;
  tiles: Dequeue<{ coords: Coords; type: string }>;
  tileMap: Map<number, { type: string }>;
} = {
  current: new Coords(),
  isBuilding: false,
  from: new Coords(),
  tiles: new Dequeue(512, () => ({ coords: new Coords(), type: "" })),
  tileMap: new Map(512, () => ({ type: "" }), hashInteger)
};

const pickedTile = new Coords();
const path = new Dequeue(512, () => new Coords());

const roadProj = new Coords();
const neighbours = createArray(4, () => new Coords());
const neighbourSt = createArray(4, () => false);

function handleRoadMove(ev: LocalMouseEvent) {
  pickTile(pickedTile, ev.clientX + cameraX, ev.clientY + cameraY);
  if (!roadSelectTile.isBuilding) {
    if ((ev.buttons & 1) !== 0) {
      roadSelectTile.isBuilding = true;
      roadSelectTile.from.assign(pickedTile);
      roadSelectTile.current.row = -1;
      roadSelectTile.current.col = -1;
      roadSelectTile.tiles.clear();
      roadSelectTile.tileMap.clear();
    } else {
      roadSelectTile.current.assign(pickedTile);
      return;
    }
  }
  if (!roadSelectTile.current.equals(pickedTile)) {
    roadSelectTile.current.assign(pickedTile);
    findShortestPath(path, roadSelectTile.from, roadSelectTile.current);

    roadSelectTile.tiles.clear();
    roadSelectTile.tileMap.clear();

    let prevIndex = -1;
    while (!path.isEmpty()) {
      const coords = path.first;
      const roadTile = roadSelectTile.tiles.push();
      roadTile.coords.assign(coords);
      path.shift();

      const index = Field.getTileIndex(coords);
      findNeighbours(neighbours, coords);
      for (let i = 0; i < 4; ++i) {
        const ni = Field.getTileIndex(neighbours[i]);
        const nextIndex = path.isEmpty() ? -1 : Field.getTileIndex(path.first);
        neighbourSt[i] = ni === prevIndex || ni === nextIndex;
      }

      const tile = Field.getTile(index);
      roadTile.type = identifyRoadType(neighbourSt, tile.type);
      roadSelectTile.tileMap.set(index).type = roadTile.type;
      prevIndex = index;
    }
  }
  if ((ev.buttons & 1) === 0) {
    roadSelectTile.isBuilding = false;
    const { tiles } = roadSelectTile;
    for (const tile of tiles) {
      Field.setTileType(Field.getTileIndex(tile.coords), tile.type);
    }
  }
}

const ROAD_TYPE_TABLE: { [key: number]: string } = {
  0b0011: "road_turn_left",
  0b1100: "road_turn_right",
  0b1001: "road_turn_top",
  0b0110: "road_turn_bottom",
  0b0101: "road_v",
  0b1010: "road_h",
  0b0001: "road_end_tl",
  0b1000: "road_end_tr",
  0b0010: "road_end_bl",
  0b0100: "road_end_br",
  0b1011: "road_tee_tl",
  0b1101: "road_tee_tr",
  0b0111: "road_tee_bl",
  0b1110: "road_tee_br",
  0b1111: "road_cross"
};

const ROAD_TYPE_REVERSE_TABLE = (() => {
  const result: { [key: string]: number } = {};
  for (const key in ROAD_TYPE_TABLE) {
    result[ROAD_TYPE_TABLE[key]] = Number(key);
  }
  return result;
})();

function identifyRoadType(ns: Array<boolean>, currentType: string) {
  const currentMask = ROAD_TYPE_REVERSE_TABLE[currentType] || 0;
  const newMask =
    (Number(ns[0]) << 3) |
    (Number(ns[1]) << 2) |
    (Number(ns[2]) << 1) |
    Number(ns[3]);
  return ROAD_TYPE_TABLE[currentMask | newMask] || "grass";
}

const farmCoords = new Coords();

function handleFarmMove(ev: LocalMouseEvent) {
  pickTile(pickedTile, ev.clientX + cameraX, ev.clientY + cameraY);
  farmCoords.assign(pickedTile);
}

const deleteInfo: {
  isDeleting: boolean;
  toCoords: Coords;
  fromCoords: Coords;
  tiles: Dequeue<Coords>;
} = {
  isDeleting: false,
  fromCoords: new Coords(),
  toCoords: new Coords(),
  tiles: new Dequeue(1024, () => new Coords())
};

function handleDelete(ev: LocalMouseEvent) {
  pickTile(pickedTile, ev.clientX + cameraX, ev.clientY + cameraY);
  const { row, col } = pickedTile;
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
    findSquare(deleteInfo.tiles, deleteInfo.fromCoords, deleteInfo.toCoords);
  }
  if ((ev.buttons & 1) === 0) {
    deleteInfo.isDeleting = false;
    while (!deleteInfo.tiles.isEmpty()) {
      const coords = deleteInfo.tiles.first;
      const ix = Field.getTileIndex(coords);
      const tile = Field.getTile(ix);
      if (ROAD_TYPE_REVERSE_TABLE[tile.type] != null) {
        Field.setTileType(ix, "grass");
      }
      deleteInfo.tiles.shift();
    }
  }
}

const projFrom = new Coords();
const projTo = new Coords();
const unproj = new Coords();
const iter = new Coords();

function findSquare(result: Dequeue<Coords>, from: Coords, to: Coords) {
  result.clear();
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
      if (
        unproj.row < 0 ||
        unproj.row >= Field.height ||
        unproj.col < 0 ||
        unproj.col >= Field.width
      ) {
        continue;
      }
      result.push().assign(unproj);
    }
  }

  return result;
}

const topLeftCoords = new Coords();
const bottomRightCoords = new Coords();

type CanvasCoords = { x: number; y: number };
const canvasCoords: CanvasCoords = { x: 0, y: 0 };

const farmBaseTiles = createArray(9, () => new Coords());
const drawCoords = new Coords();

function draw() {
  ctx.strokeStyle = "#a0a0a0";
  ctx.lineWidth = 1;

  pickTile(topLeftCoords, cameraX, cameraY);
  pickTile(bottomRightCoords, cameraX + width, cameraY + height);
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
    for (const tile of deleteInfo.tiles) {
      getCanvasCoords(canvasCoords, tile);
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

  if (cursorMode === "road" && roadSelectTile.isBuilding) {
    const roadTile = roadSelectTile.tileMap.get(tileIx);
    if (roadTile != null) type = roadTile.type;
  }

  if (TILE_IMG_INDICES[type] != null) {
    drawTileImg(canvasCoords, TILE_IMG_INDICES[type]);
  } else if (type === "grass") {
    drawTileImg(canvasCoords, 0);
  }

  if (cursorMode === "road" && roadSelectTile.current.equals(target)) {
    buildTilePath(canvasCoords);
    ctx.fillStyle = "rgba(0, 255, 0, 0.5)";
    ctx.fill();
  }
}

function getCanvasCoords(result: CanvasCoords, coords: Coords) {
  const { row, col } = coords;
  result.x = col * TILE_HALF_WIDTH * 2 + (row % 2) * TILE_HALF_WIDTH - cameraX;
  result.y = row * TILE_HALF_HEIGHT - cameraY;
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

const camMove = { x: 0, y: 0, camX: 0, camY: 0, moving: false };

function handleMouseEvent(ev: MouseEvent) {
  if (mouseEvents.isFull()) {
    mouseEvents.shift();
  }
  const lastEv = mouseEvents.push();
  lastEv.clientX = ev.clientX;
  lastEv.clientY = ev.clientY;
  lastEv.buttons = ev.buttons;
}

canvas.addEventListener("mousemove", handleMouseEvent);
canvas.addEventListener("mousedown", handleMouseEvent);
canvas.addEventListener("mouseup", handleMouseEvent);

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
