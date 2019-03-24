export default function invariant(cond: boolean, message?: string): void {
  if (!cond) {
    throw new Error(
      "invariant failed" + (message != null ? ": " + message : "")
    );
  }
}
