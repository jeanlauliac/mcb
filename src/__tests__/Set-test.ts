import Set from "../Set";

let set: Set<number>;

beforeEach(() => {
  set = new Set(10, (num: number) => num);
});

it("return false for unknown keys", () => {
  expect(set.has(3)).toBe(false);
});

it("tracks a key", () => {
  set.add(3);
  expect(set.has(3)).toBe(true);
});

it("deletes a key", () => {
  set.add(3);
  expect(set.delete(3)).toBe(true);
  expect(set.has(3)).toBe(false);
});
