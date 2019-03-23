import Map from '../Map';

let map: Map<number, {value: number}>;

beforeEach(() => {
  map = new Map(10, () => ({value: 0}), (num: number) => num);
});

it('return null for unknown keys', () => {
  expect(map.get(3)).toBe(null);
});

it('stores a key-value pair', () => {
  map.set(3).value = 1;
  expect(map.get(3)).toEqual({value: 1});
});

it('deletes a key-value pair', () => {
  map.set(3).value = 1;
  expect(map.delete(3)).toBe(true);
  expect(map.get(3)).toEqual(null);
});

it('overrides a key-value pair', () => {
  map.set(3).value = 1;
  map.set(3).value = 2;
  expect(map.get(3)).toEqual({value: 2});
});

it('stores many key-value pairs', () => {
  map.set(3).value = 1;
  map.set(15).value = 2;
  map.set(5).value = 3;
  map.set(11).value = 4;
  map.set(7).value = 5;
  map.set(9).value = 6;
  map.set(17).value = 7;
  expect(map.get(3)).toEqual({value: 1});
  expect(map.get(15)).toEqual({value: 2});
  expect(map.get(5)).toEqual({value: 3});
  expect(map.get(11)).toEqual({value: 4});
  expect(map.get(7)).toEqual({value: 5});
  expect(map.get(9)).toEqual({value: 6});
  expect(map.get(17)).toEqual({value: 7});
});

it('handles collision deletions', () => {
  map.set(3).value = 1;
  map.set(13).value = 2;
  map.set(23).value = 3;
  expect(map.delete(13)).toBe(true);
  expect(map.get(3)).toEqual({value: 1});
  expect(map.get(13)).toEqual(null);
  expect(map.get(23)).toEqual({value: 3});
});
