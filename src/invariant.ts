export default function invariant(cond: boolean): void {
  if (!cond) {
    throw new Error('invariant failed');
  }
}
