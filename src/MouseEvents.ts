import ScreenCoords from "./ScreenCoords";

export enum MouseEventType {
  Move,
  Down,
  Up
}

export enum MouseEventButton {
  Primary = 0
}

export class LocalMouseEvent {
  coords = new ScreenCoords();
  buttons: number;
  button: MouseEventButton;
  type: MouseEventType;

  isPrimaryDown() {
    return (
      this.type === MouseEventType.Down &&
      this.button === MouseEventButton.Primary
    );
  }

  isPrimaryUp() {
    return (
      this.type === MouseEventType.Up &&
      this.button === MouseEventButton.Primary
    );
  }
}
