export enum MouseEventType {
  Move,
  Down,
  Up
}

export enum MouseEventButton {
  Primary = 0
}

export class LocalMouseEvent {
  clientX: number;
  clientY: number;
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
