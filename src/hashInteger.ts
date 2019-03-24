
const table: Array<number> = [];
for (let i = 0; i < 256; ++i) {
  table.push(Math.floor(Math.random() * Math.pow(2, 32)));
}

export default function hashInteger(n: number): number {
  let result = 0;
  while (n > 0) {
    result ^= table[n & 255];
    n >>= 8;
  }
  return result;
}

(window as any).hashInteger = hashInteger;
