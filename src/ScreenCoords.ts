export default class ScreenCoords {
  x: number;
  y: number;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  set(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  assign(coords: ScreenCoords): this {
    this.x = coords.x;
    this.y = coords.y;
    return this;
  }

  sum(coords: ScreenCoords): this {
    this.x += coords.x;
    this.y += coords.y;
    return this;
  }

  scale(scalar: number): this {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }
}
