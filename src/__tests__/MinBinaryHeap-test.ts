import MinBinaryHeap from "../MinBinaryHeap";

it("works in a basic case", () => {
  const heap = new MinBinaryHeap(10, () => ({ value: null }));
  expect(heap.size).toBe(0);
  expect(heap.isEmpty()).toBe(true);

  heap.push(10).value = "foo";
  expect(heap.size).toBe(1);
  expect(heap.isEmpty()).toBe(false);
  expect(heap.peek().value).toBe("foo");

  heap.push(15).value = "bar";
  expect(heap.size).toBe(2);
  expect(heap.peek().value).toBe("foo");

  heap.push(5).value = "glo";
  expect(heap.size).toBe(3);
  expect(heap.peek().value).toBe("glo");

  heap.pop();
  expect(heap.size).toBe(2);
  expect(heap.peek().value).toBe("foo");

  heap.pop();
  expect(heap.size).toBe(1);
  expect(heap.peek().value).toBe("bar");

  heap.pop();
  expect(heap.size).toBe(0);
  expect(heap.isEmpty()).toBe(true);
});
