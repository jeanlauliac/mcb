export default class ScreenCoords {
  x: number;
  y: number;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  set(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  assign(coords: ScreenCoords): void {
    this.x = coords.x;
    this.y = coords.y;
  }

  sum(coords: ScreenCoords): void {
    this.x += coords.x;
    this.y += coords.y;
  }

  scale(scalar: number) {
    this.x *= scalar;
    this.y *= scalar;
  }
}
