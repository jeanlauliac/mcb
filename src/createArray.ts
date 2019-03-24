export default function createArray<Value>(
  size: number,
  ctor: (i: number) => Value
): Array<Value> {
  const result = [];
  for (let i = 0; i < size; ++i) {
    result.push(ctor(i));
  }
  return result;
}
