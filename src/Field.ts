
export const width = 29;
export const height = 39;

export const data = (() => {
  let result = Array(height * width);
  for (let i = 0; i < result.length; ++i) {
    result[i] = {
      type: 'grass',
    };
  }
  return result;
})();
