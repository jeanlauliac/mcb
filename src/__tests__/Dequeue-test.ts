import Dequeue from '../Dequeue';

it('pushes and pops a value', () => {
  const stack = new Dequeue(10, () => ({value: 0}));
  expect(stack.size).toEqual(0);
  expect(stack.isEmpty()).toEqual(true);

  stack.push().value = 42;
  expect(stack.last.value).toEqual(42);
  expect(stack.size).toEqual(1);
  expect(stack.isEmpty()).toEqual(false);

  stack.pop();
  expect(stack.size).toEqual(0);
  expect(stack.isEmpty()).toEqual(true);
});

it('unshifts and shifts a value', () => {
  const stack = new Dequeue(10, () => ({value: 0}));
  expect(stack.size).toEqual(0);
  expect(stack.isEmpty()).toEqual(true);

  stack.unshift().value = 42;
  expect(stack.first.value).toEqual(42);
  expect(stack.size).toEqual(1);
  expect(stack.isEmpty()).toEqual(false);

  stack.shift();
  expect(stack.size).toEqual(0);
  expect(stack.isEmpty()).toEqual(true);
});

it('pushes and shifts values repeatedly', () => {
  const queue = new Dequeue(10, () => ({value: 0}));

  for (let i = 0; i < 10; ++i) {
    queue.push().value = 1;
    queue.push().value = 2;
    queue.push().value = 3;
    queue.push().value = 4;

    const result = [];
    while (!queue.isEmpty()) {
      result.push(queue.first.value);
      queue.shift();
    }

    expect(result).toEqual([1, 2, 3, 4]);
  }
});
