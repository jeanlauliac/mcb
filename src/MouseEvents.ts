import ScreenCoords from "./ScreenCoords";

export enum MouseEventType {
  Move,
  Down,
  Up
}

export enum MouseEventButton {
  Primary = 0,
  Secondary = 2,
}

export class LocalMouseEvent {
  coords = new ScreenCoords();
  buttons: number;
  button: MouseEventButton;
  type: MouseEventType;

  wasPrimaryPressed() {
    return (
      this.type === MouseEventType.Down &&
      this.button === MouseEventButton.Primary
    );
  }

  wasPrimaryReleased() {
    return (
      this.type === MouseEventType.Up &&
      this.button === MouseEventButton.Primary
    );
  }

  wasSecondaryPressed() {
    return (
      this.type === MouseEventType.Down &&
      this.button === MouseEventButton.Secondary
    );
  }

  wasSecondaryReleased() {
    return (
      this.type === MouseEventType.Up &&
      this.button === MouseEventButton.Secondary
    );
  }
}
